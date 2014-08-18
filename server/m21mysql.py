import getpass
import logging
import sys
import os
import json

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
        
        self.hostpath = '' # 'http://web.mit.edu/music21/music21j'
        
        self.title = "Music21j Project"

        self.pw = None
        self.con = None
        self.mysqlVersion = None
    
        self.parseForm() # self.jsonForm from self.form
        try:
            self.connect()
        except M21JMysqlException:
            pass # okay at this point; maybe the user intended to connect later
    
    def __del__(self):
        if self.con:
            self.con.close()
    
    def connect(self):
        if self.con is not None:
            return
        
        try:
            con = mdb.connect(self.host, self.user, self.getPW(), self.db)
            
            cur = con.cursor()
            cur.execute("SELECT VERSION()")
            
            version = cur.fetchone()
            self.mysqlVersion = version[0];
        
        except mdb.Error as e:
            raise M21JMysqlException("Error %d: %s" % (e.args[0], e.args[1]))

        self.con = con
        
    def parseForm(self):
        if self.form is None:
            return
        if 'json' not in self.form:
            return
        jsonString = self.form.getfirst('json')
        self.jsonForm = json.loads(jsonString)
        return self.jsonForm

    def jsonReply(self, pyObj):
        self.printJsonHeader()
        print(json.dumps(pyObj))        
        
    def getPW(self):  
        username = getpass.getuser()
        userdir = os.path.expanduser("~" + username)
        
        #logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)
        #logging.debug(username)
        
        mysqlPasswordFile = userdir + os.path.sep + '.music21j_password'
        if not os.path.exists(mysqlPasswordFile):
            raise M21JMysqlException("Cannot read password file!")
        
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
        userData = self.getUserData()
        if 'email' not in userData:
            raise M21JMysqlException('Email not in userData: %s' % userData)
        email = userData['email']
        if 'password' not in userData:
            raise M21JMysqlException('Password not in jsonForm: %s' % userData)
        password = userData['password']
        cur = self.con.cursor()
        cur.execute("SELECT password FROM users WHERE email = %s", (email, ) )
            
        storedPWtuple = cur.fetchone()
        if (storedPWtuple is None):
            return None
        storedPW = storedPWtuple[0]
        if password == storedPW:
            return True
        else:
            return False
                
        
    def getUserData(self):
        if self.jsonForm is None:
            raise M21JMysqlException('No form submitted!')
        if 'userData' not in self.jsonForm:
            raise M21JMysqlException('userData not in jsonForm: %s' % self.jsonForm)
        return self.jsonForm['userData']


    def changePassword(self):
        self.title = 'Change Password'
        self.printHeader()
#         print(r'''
#         <script>
#         require(['m21theory'], function () {
#            s = new music21.stream.Stream();
#            s.append( new music21.note.Note("C4") );
#            s.appendNewCanvas();
#         });
#         </script>
#         ''')
        if "name" in self.form:
            print(self.form.getfirst('name'))
        self.printFooter()
        
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
<div class="related">
    <ul><li><a href="#">21m.051 Cuthbert</a> &raquo; <a href="#">{title}</a></li></ul>
</div>
<div class="document">
  <div class="documentwrapper">
       <div class="sidebar" id="infoDiv"></div>
  
    <div class="bodywrapper">
      <div class="body" id="testBank">
        '''
        print(template.format(**{'title': self.title,
                               'hostpath': self.hostpath
                               }))
        
    def printHTTPHeader(self):
        print("Content-Type: text/html")
        print("")

    def printJsonHeader(self):
        print("Content-Type: text/json")
        print("")
                
    def printFooter(self):
        print ('''
        
              </div>
    </div>
  </div>
</div> 
</body>        
</html>
''')

if (__name__ == '__main__'):
    m = M21JMysql(db='cuthbert')
    cur = m.con.cursor()
    cur.execute("SELECT * FROM countries")
    rows = cur.fetchall()
    for row in rows:
        print(row)
    
