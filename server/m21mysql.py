import getpass
import logging
import sys
import os
import json
import collections
import codecs
import datetime

import MySQLdb as mdb

# for mac, use
# http://stackoverflow.com/questions/1448429/how-to-install-mysqldb-python-data-access-library-to-mysql-on-mac-os-x#1448476
#
# don't forget to symlink!

class M21JMysqlException(Exception):
    pass

class M21JMysql(object):
    
    def __init__(self, form=None, host='localhost', user='cuthbert', db='fundamentals'):
        self.form = form
        self.jsonForm = None
        
        self.host = host
        self.user = user
        self.db = db
        self.userdir = None
        
        self.hostpath = '' # 'http://web.mit.edu/music21/music21j'
        
        self.title = "Music21j Project"

        self.pw = None
        self.con = None
        self.mysqlVersion = None
        
        self.useJsonP = False  # Cross-domain scripting adds an additional form field, jsonp or callback
        self.jsonPCallFunction = None  # which specifies a callback function in the reply.
    
        self.parseForm() # self.jsonForm from self.form
        try:
            self.connect()
        except M21JMysqlException:
            pass # okay at this point; maybe the user intended to connect later
    
    def __del__(self):
        if self.con:
            self.con.close()
    
    def err(self, msg=""):
        msg = str(msg)
        sys.stderr.write("M21MYSQL: " + msg + "\n");
    
    def connect(self):
        if self.con is not None:
            return
        
        try:
            con = mdb.connect(self.host, self.user, self.getMysqlPW(), self.db)
            
            cur = con.cursor()
            cur.execute("SELECT VERSION()")
            
            version = cur.fetchone()
            self.mysqlVersion = version[0];
        
        except mdb.Error as e:
            raise M21JMysqlException("Error %d: %s" % (e.args[0], e.args[1]))

        self.con = con


    def execute(self, query, params=None):
        if params is None:
            params = ()
        self.con.begin()
        res = None
        try:
            cursor = self.con.cursor()
            res = cursor.execute(query, params)
            self.con.commit()
            cursor.close()            
            return res
        except Exception as e:
            self.con.rollback()
            raise e
        
    def query(self, query, params=None):
        """
        Run a query on this connection, returning all results at once.
        Used to make a named tuple.

        adapted from https://gist.github.com/adamv/577700
        """
        if params is None:
            params = ()
 
        results = ()
        cursor = self.con.cursor()
        try:
            cursor.execute(query, params)
            names = " ".join(d[0] for d in cursor.description)
            klass = collections.namedtuple('Results', names)
            results = map(klass._make, cursor.fetchall())
        finally:
            cursor.close()
        return results

    def queryOne(self, query, params=None):
        if params is None:
            params = ()
 
        results = ()
        cursor = self.con.cursor()
        try:
            cursor.execute(query, params)
            names = " ".join(d[0] for d in cursor.description)
            klass = collections.namedtuple('Results', names)
            oneRow = cursor.fetchone()
            if oneRow is not None:
                result = klass(*oneRow)
            else:
                result = None
        finally:
            cursor.close()
        return result
        
    def parseForm(self):
        if self.form is None:
            return
        if 'json' not in self.form:
            return
        jsonString = self.form.getfirst('json')
        self.jsonForm = json.loads(jsonString)
        if 'jsonp' in self.form:
            self.useJsonP = True
            self.jsonPCallFunction = self.form.getfirst('jsonp')        
        elif 'callback' in self.form:
            self.useJsonP = True
            self.jsonPCallFunction = self.form.getfirst('callback') 
            
        return self.jsonForm

    def jsonReply(self, pyObj):
        self.printJsonHeader()
        jsonString = json.dumps(pyObj)
        if self.useJsonP is not True:
            print(jsonString)
        else:
            print(self.jsonPCallFunction + "(" + jsonString + ")\n")
        
    def getMysqlPW(self, userdir = None):
        if userdir is None:
            if self.userdir is not None:
                userdir = self.userdir
            else:
                username = getpass.getuser()
                userdir = os.path.expanduser("~" + username)
        
        #logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)
        #logging.debug(username)
        
        mysqlPasswordFile = userdir + os.path.sep + '.music21j_password'
        if not os.path.exists(mysqlPasswordFile):
            raise M21JMysqlException("Cannot read password file! put it in a file in the home directory called .music21j_password")
        
        with open(mysqlPasswordFile) as f:
            pw = f.read().strip()
        return pw

    def checkLogin(self):
        '''
        checks login and sends a reply to the user.
        
        verifyLogin does the heavy lifting
        '''
        checksOut = self.verifyLogin()
        self.jsonReply(checksOut)


    def verifyLogin(self):
        '''
        returns True if everything checked out; False if the email didn't match the password
        and None if the email could not be found in the system.
        '''
        studentData = self.getStudentData()
        if 'email' not in studentData:
            raise M21JMysqlException('Email not in studentData: %s' % studentData)
        email = studentData['email']
        if 'password' not in studentData:
            raise M21JMysqlException('Password not in jsonForm: %s' % studentData)
        password = studentData['password']
        
        storedPWtuple = self.queryOne('SELECT password FROM users WHERE email = %s', (email, ))
        #self.err(storedPWtuple.password)
        storedPW = codecs.encode(storedPWtuple.password, 'rot_13') # very simple password security :-)
        
        if password == storedPW:
            return True
        else:
            return False

    def getUserId(self):
        studentData = self.getStudentData()
        if 'email' not in studentData:
            raise M21JMysqlException('Email not in studentData')
        email = studentData['email']
        info = self.queryOne('SELECT id FROM users WHERE email = %s', (email, ))
        if info is None:
            raise M21JMysqlException('Email not in database!')
        return info.id
        
    def getStudentData(self):
        if self.jsonForm is None:
            raise M21JMysqlException('No form submitted!')
        if 'studentData' not in self.jsonForm:
            raise M21JMysqlException('studentData not in jsonForm: %s' % self.jsonForm)
        return self.jsonForm['studentData']


    def sendComment(self):
        try:
            userId = self.getUserId()
        except M21JMysqlException:
            userId = 0
        try:
            j = self.jsonForm
            self.execute(
                '''INSERT INTO comments (bankId, sectionId, 
                                        userId, comment, seed
                                        )
                                VALUES (%s, %s,
                                        %s, %s, %s)
                ''', (j['bankId'], j['sectionId'],
                      userId, j['comment'], j['seed']
                      )
                )
        except Exception as e:
            self.err(e)
            self.jsonReply({'success': False})
            raise e
        
        self.jsonReply({'success': True})

        
    def submitSection(self):
        if self.verifyLogin() is False:
            self.jsonReply({'success': False,
                            'login': False,
                            })
        else:
            userId = self.getUserId()
            j = self.jsonForm
            if 'sectionId' not in j:
                j['sectionId'] = "unknownSection"
            #startTime = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(j['startTime']/1000))
            #endTime = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(j['startTime']/1000))
            try:
                self.execute(
                '''INSERT INTO section (bankId, sectionId, sectionIndex, 
                                        userId, numRight, numWrong, numMistakes, numUnanswered,
                                        totalQs, startTime, endTime, seed
                                        )
                                VALUES (%s, %s, %s,
                                        %s, %s, %s, %s, %s,
                                        %s, FROM_UNIXTIME('%s'), FROM_UNIXTIME('%s'), %s
                                        )
                ''', (j['bankId'], j['sectionId'], j['sectionIndex'],
                      userId, j['numRight'], j['numWrong'], j['numMistakes'], j['numUnanswered'],
                      j['totalQs'], j['startTime']/1000, j['endTime']/1000, j['seed']
                      )
                )
            except Exception as e:
                self.err(e)
                self.jsonReply({'success': False,
                                'login': True,
                                'dbSuccess': False,
                                })
            self.jsonReply({'success': True,
                            'login': True,
                            'dbSuccess': True,                            
                            })


    def changePassword(self):
        self.title = 'Change Password'        
        reply = ""
        if self.jsonForm is None or 'newPassword' not in self.jsonForm:
            self.printHeader()
            print(r'''
        <script>
        require(['m21theory'], function () {
           m21theory.style.apply({loadCss: false});
           m21theory.userData.fillNameDiv();           
           var $t = $("#testBank");
           $t.append('<h1>Change Password</h1><hr/><p>Enter your old password and email above ' +
           'and your new password, twice, below.</p>'
           );
           $t.append('<table><tr><td>New Password:</td><td><input type="password" id="newPassword" size=20 class="lightInput" /></td></tr>' + 
               '<tr><td>Re-enter Password:</td><td><input type="password" id="newPasswordVerify" size=20 class="lightInput" /></td></tr></table>');
           var $b = $('<button class="lightInput">Change Password</button>');
           $b.click( function (e) {  
               var newPw = $('#newPassword').val();
               var newPwVerify = $('#newPasswordVerify').val();
               if (newPw != newPwVerify) {
                   m21theory.feedback.alert("Your passwords do not match! Re verify!", 'alert');
               } else {
                   m21theory.serverSettings.makeAjax({newPassword: newPw},
                       { 
                       url: m21theory.serverSettings.changePassword,
                       success: function (json) {
                               m21theory.feedback.alert(json.msg, json.type);
                               m21theory.userData.changeData('password', newPw, true); // silent
                           },
                       } );
               }
           } );
           $t.append($b);
        });
        </script>            
            ''')
            self.printFooter()
        else:
            try:
                checksOut = self.verifyLogin()
            except M21JMysqlException:
                checksOut = false;
            if not checksOut:
                reply = {'msg': 'Make sure you login successfully before changing password.',
                         'type': 'alert'}
                self.jsonReply(reply)
            else:
                newPassword = self.jsonForm['newPassword']
                if newPassword:
                    ud = self.getStudentData()
                    obfuscated = codecs.encode(newPassword, 'rot_13') # yeah...
                    try:
                        self.execute("UPDATE users SET password = %s WHERE email = %s", 
                                     (obfuscated, ud['email'])
                                     )
                        reply = {'msg': 'Password successfully changed',
                                 'type': 'ok'}
                        self.jsonReply(reply)
                    except:
                        reply = {'msg': 'Password successfully changed',
                                 'type': 'ok'}
                        self.jsonReply(reply)                        
                else:
                    reply = {'msg': 'Something has gone wrong...',
                             'type': 'alert'}
                    self.jsonReply(reply)

        
    def printHeader(self):
        self.printHTTPHeader()
        template = '''
<html>
<head>
<title>{title}</title>
<link rel="stylesheet" href="{hostpath}/css/m21theory.css" type="text/css" />
 <script data-main="{hostpath}/src/m21theory" src="{hostpath}/ext/require/require.js"></script>
</head>
<body>
        '''
        print(template.format(**{'title': self.title,
                               'hostpath': self.hostpath
                               }))
        
    def printHTTPHeader(self):
        print("Content-Type: text/html")
        print("")

    def printJsonHeader(self):
        if self.useJsonP:
            ct = 'application/javascript'
        else:
            ct = 'text/json'
        print("Content-Type: " + ct)
        print("")
                
    def printFooter(self):
        print ('''</body></html>''')

#     def checkServerPassword(self):
#         storedPW = self.getMysqlPW()
#         submittedPW = self.jsonForm['gradebookPw']
#         if (storedPW == submittedPW):
#             return True
#         else:
#             return False
        
    def checkIfAdmin(self):
        if not self.verifyLogin():
            return False
        ud = self.getStudentData()
        sec = self.queryOne("SELECT id, section FROM admins WHERE email = %s", (ud['email'], ))
        if sec is None or sec == "":
            return False
        return sec

    def gradebook(self):
        section = self.checkIfAdmin()
        if section is False:
            self.jsonReply({'error': 'This user is not authorized to view the gradebook'});
        else:
            self.section = section
            if 'function' not in self.jsonForm:
                self.jsonReply({'password': True,
                                'error': 'no function specified'
                                })
            else:
                jrFunc = self.jsonForm['function']
                if jrFunc == 'getComments':
                    self.gradesComments()
                else:
                    self.jsonReply({'password': True,
                                    'error': 'illegal function',
                                    })
                
    def namedTuplesToJS(self, listOfNamedTuples):
        listOut = []
        for row in listOfNamedTuples:
            listOut.append(self.namedTupleToJS(row))
        return listOut

    def namedTupleToJS(self, nt):
        rcd = {}
        for fn in nt._fields:
            v = getattr(nt, fn)
            if isinstance(v, datetime.datetime):
                v = int(v.strftime('%s'))  # convert to epoch
            rcd[fn] = v
        return rcd

    def getUserInfoFromId(self, userId):
        ui = self.queryOne('SELECT first, last, email FROM users WHERE id = %s', (userId, ))
        return ui

    def gradesComments(self):
        q = self.query('SELECT comment, userId, lastUpdated, bankId, sectionId FROM comments ORDER BY lastUpdated DESC limit 20')
        recentComments = self.namedTuplesToJS(q)
        for r in recentComments:
            self.err(r)
            ui = self.getUserInfoFromId(r['userId'])
            if ui is not None:
                userInfo = self.namedTupleToJS(ui)
            else:
                userInfo = {}
            r['userInfo'] = userInfo
        #self.err(recentComments)
        #self.err(json.dumps(recentComments))            
        self.jsonReply({'password': True,
                        'comments': recentComments,
                        'error': None,
                        })
        return;

if (__name__ == '__main__'):
    m = M21JMysql(db='cuthbert')
    cur = m.con.cursor()
    cur.execute("SELECT * FROM countries")
    rows = cur.fetchall()
    for row in rows:
        print(row)
    
