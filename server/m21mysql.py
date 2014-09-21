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

BankResults = collections.namedtuple('BankResults', "totalQs numRight numWrong numUnanswered numMistakes")

class M21JMysql(object):
    
    def __init__(self, form=None, host=None, user=None, database=None):
        self.form = form
        self.jsonForm = None
        
        try:
            pwDict = self.readMusic21jPasswordFile()
        except:
            pwDict = {}
            
            
        if host is not None:        
            self.host = host
        elif 'host' in pwDict:
            self.host = pwDict['host']
        else:
            self.host = 'localhost'

        if user is not None:            
            self.user = user
        elif 'user' in pwDict:
            self.user = pwDict['user']
        else:
            self.user = ""
        
        if database is not None:
            self.db = database
        elif 'database' in pwDict:
            self.db = pwDict['database']
        else:
            self.db = "" 

        self.userdir = None

        self.imagesURI = 'http://zachara.mit.edu/051_non_git/student_images/'
        self.smtpHost = 'outgoing.mit.edu'
        self.profEmail = 'cuthbert@mit.edu'
        self.adminEmails = ['cuthbert@mit.edu', 'bhadley@mit.edu','tencate@mit.edu']
        
        self.hostpath = '' # 'http://web.mit.edu/music21/music21j'
        if ('REQUEST_URI' in os.environ):
            uri = os.environ['REQUEST_URI']
            if '/server' in uri:
                index = uri.index('/server')
                hostpath = uri[0:index]
                self.hostpath = hostpath
        
        self.title = "Music21j Project"

        self.pw = None
        self.con = None
        self.mysqlVersion = None
        
        self.useJsonP = False  # Cross-domain scripting adds an additional form field, jsonp or callback
        self.jsonPCallFunction = None  # which specifies a callback function in the reply.
    
        self.parseForm() # self.jsonForm from self.form
        try:
            self.connect()
        except M21JMysqlException as e:
            raise(e) # okay at this point; maybe the user intended to connect later
    
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

    def getMysqlPW(self, userdir = None):
        pwDict = self.readMusic21jPasswordFile(userdir)
        return pwDict['password']
    
    def readMusic21jPasswordFile(self, userdir = None):
        if userdir is None:
            if self.userdir is not None:
                userdir = self.userdir
            else:
                username = getpass.getuser()
                userdir = os.path.expanduser("~" + username)
                # likely to be /Library/Webserver on Mac
        #logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)
        #logging.debug(username)
        
        mysqlPasswordFile = userdir + os.path.sep + '.music21j_password'
        if not os.path.exists(mysqlPasswordFile):
            raise M21JMysqlException("Cannot read password file! put it in a file in the home directory called .music21j_password. Home directory is: " + userdir)
        
        with open(mysqlPasswordFile) as f:
            pwContents = f.readlines()
        
        pwDict = {'password': None,
                  'host': 'localhost',
                  'username': 'cuthbert',
                  'database': 'fundamentals'}
        for i,p in enumerate(pwContents):
            p = p.strip()
            if '=' in p:
                key, value = p.split('=', 1)
                pwDict[key] = value
            else:
                pwDict['password'] = p
        
        return pwDict

    ## Queries

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

    def queryJSreturn(self, query, params=None, getUserInfo=True):
        q = self.query(query, params)
        jsq = self.namedTuplesToJS(q)
        if len(jsq) > 0 and 'userId' in jsq[0] and getUserInfo is True:
            for r in jsq:
                r['userInfo'] = self.getUserInfoFromId(r['userId'])
        return jsq
        
    ## Low level communication
        
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

    def printJsonHeader(self):
        if self.useJsonP:
            ct = 'application/javascript'
        else:
            ct = 'text/json'
        print("Content-Type: " + ct)
        print("")
                
    def jsonReply(self, pyObj):
        self.printJsonHeader()
        jsonString = json.dumps(pyObj)
        if self.useJsonP is not True:
            print(jsonString)
        else:
            print(self.jsonPCallFunction + "(" + jsonString + ")\n")
    
    ## login management...
        
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
        if storedPWtuple is not None:
            storedPW = codecs.encode(storedPWtuple.password, 'rot_13') # very simple password security :-)
        else:
            storedPW = None
        
        if password == storedPW:
            return True
        else:
            return False

    def getUserIdFromEmail(self, email=None):
        if email is None:
            studentData = self.getStudentData()
            if 'email' not in studentData:
                raise M21JMysqlException('Email not in studentData')
            email = studentData['email']
        info = self.queryOne('SELECT id FROM users WHERE email = %s', (email, ))
        if info is None:
            raise M21JMysqlException('Email not in database!')
        return info.id
    
    def verifyGetId(self):
        '''
        verifies the login, sends a reply if not.
        
        if admin and 'forUser' is set, gets the info for that student instead.
        
        returns a proper userId or None.  If None, the calling function should immediately return
        '''
        if self.verifyLogin() is False:
            self.jsonReply({'success': False,
                            'login': False,
                            })
            return;
        if 'forUser' in self.jsonForm:
            if self.checkIfAdmin() is False:
                self.jsonReply({'success': False,
                            'login': False,
                            })
                return;
            forStudent = self.jsonForm['forUser']
            if '@' not in forStudent:
                forStudent += '@mit.edu'                
        else:
            forStudent = self.getStudentData()['email']
        uid = self.getUserIdFromEmail(forStudent)
        return uid
    
    def getStudentData(self):
        ## return the student data from the JSON submitted...
        if self.jsonForm is None:
            raise M21JMysqlException('No form submitted!')
        if 'studentData' not in self.jsonForm:
            raise M21JMysqlException('studentData not in jsonForm: %s' % self.jsonForm)
        return self.jsonForm['studentData']

    def getUserInfoFromId(self, userId):
        '''
        returns a dict rather than named tuplet...
        '''
        ui = self.queryOne('SELECT * FROM users WHERE id = %s', (userId, ))
        if ui is not None:
            userInfo = self.namedTupleToJS(ui)
            del(userInfo['password'])
            userInfo['imageURI'] = self.imagesURI + str(userId) + '.jpg' # should this be scrubbed for students???
        else:
            userInfo = {}
        return userInfo

    ### Submissions

    def submitQuestion(self):
        userId = self.verifyGetId()
        if userId is None:
            return

        j = self.jsonForm
        if 'sectionId' not in j:
            j['sectionId'] = "unknownSection"

        for ans in ('studentAnswer', 'storedAnswer'):                
            if ans not in j:
                j[ans] = ''
            if j[ans] != unicode(j[ans]):
                j[ans] = json.dumps(j[ans])
            
            
        #startTime = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(j['startTime']/1000))
        #endTime = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(j['startTime']/1000))
        try:
            self.execute(
            '''REPLACE INTO question (bankId, sectionId, sectionIndex, questionIndex, 
                                    userId, answerStatus, studentAnswer, storedAnswer,
                                    startTime, endTime, seed, numMistakes
                                    )
                            VALUES (%s, %s, %s, %s,
                                    %s, %s, %s, %s,
                                    FROM_UNIXTIME('%s'), FROM_UNIXTIME('%s'), %s, %s
                                    )
            ''', (j['bankId'], j['sectionId'], j['sectionIndex'], j['questionIndex'],
                  userId, j['answerStatus'], j['studentAnswer'], j['storedAnswer'],
                  j['startTime']/1000, j['endTime']/1000, j['seed'], j['numMistakes']
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

        
    def submitSection(self):
        userId = self.verifyGetId()
        if userId is None:
            return
        j = self.jsonForm
        if 'sectionId' not in j:
            j['sectionId'] = "unknownSection"
        if 'outcome' not in j:
            j['outcome'] = 'unknown'
        if 'sectionIndex' not in j:
            j['sectionIndex'] = -1
        #startTime = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(j['startTime']/1000))
        #endTime = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(j['startTime']/1000))
        try:
            self.execute(
            '''REPLACE INTO section (bankId, sectionId, sectionIndex, 
                                    userId, numRight, numWrong, numMistakes, numUnanswered,
                                    totalQs, startTime, endTime, seed, outcome
                                    )
                            VALUES (%s, %s, '%s',
                                    '%s', '%s', '%s', '%s', '%s',
                                    '%s', FROM_UNIXTIME('%s'), FROM_UNIXTIME('%s'), '%s', %s
                                    )
            ''', (j['bankId'], j['sectionId'], j['sectionIndex'],
                  userId, j['numRight'], j['numWrong'], j['numMistakes'], j['numUnanswered'],
                  j['totalQs'], j['startTime']/1000, j['endTime']/1000, j['seed'], j['outcome']
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

    def submitBank(self):
        userId = self.verifyGetId()
        if userId is None:
            return
        j = self.jsonForm
        try:
            self.execute(
            '''REPLACE INTO bank (bankId,  
                                    userId, numRight, numWrong, numMistakes, numUnanswered,
                                    totalQs, startTime, endTime, seed, url
                                    )
                            VALUES (%s,
                                    %s, %s, %s, %s, %s,
                                    %s, FROM_UNIXTIME('%s'), FROM_UNIXTIME('%s'), %s, %s
                                    )
            ''', (j['bankId'],
                  userId, j['numRight'], j['numWrong'], j['numMistakes'], j['numUnanswered'],
                  j['totalQs'], j['startTime']/1000, j['endTime']/1000, j['seed'], j['url']
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

    def numSectionsForBank(self, bankId):
        '''
        returns the number of sections for a bank...
        '''
        ui = self.queryOne('SELECT MAX(sectionIndex) AS si FROM section WHERE bankId = %s', (bankId, ))
        if ui is not None:
            return ui.si + 1
        else:
            return None
    
    def getBanks(self):
        # TODO: use bankInfo...
        banks = self.queryJSreturn("SELECT bankId, url, max(lastUpdated) AS lastUpdated FROM bank WHERE url IS NOT NULL GROUP BY bankId ORDER BY lastUpdated DESC")
        self.jsonReply({'banks': banks})
        
    
    def getStartEndTimeForUserBank(self, userId, bankId):
        ### TODO: BankInfo
        ui = self.queryOne('''SELECT MIN(startTime) AS startTime, MAX(endTime) AS endTime
                            FROM section WHERE bankId = %s AND userId = %s
        ''', (bankId, userId))
        return ui

    
    
    # -- grade and question retrieval
    
    def activeBanks(self, bankType=None, includeClosed=True):  
        ''' returns dict '''     
        qStr = "SELECT * " 
        
        qStr += ", startTime < NOW() "
        qStr += "AND endTime > NOW() "
        qStr += "AS active "
                
        qStr += "FROM bankInfo WHERE startTime < NOW() "
        if bankType is not None and bankType != 'all':
            qStr += "AND type = '%s' " % bankType    
        if includeClosed is False:
            qStr += "AND endTime > NOW() "
        qStr += "ORDER BY endTime DESC "
        banks = self.queryJSreturn(qStr)
        # whoops, named tuple
        for b in banks:
            if b['url'] is None:
                url = b['bankId']
                url += '.html'
                b['url'] = url
            if b['active'] == 1:
                b['active'] = True
            else:
                b['active'] = False
        return banks

    def gradesByType(self, userId = None):
        '''
        return all grades or links by type.
        '''
        if userId is None:
            userId = self.verifyGetId()
        if userId is None:
            return
        bankType = 'all'
        if self.jsonForm is not None and 'type' in self.jsonForm:
            bankType = self.jsonForm['type']
        activeBanks = self.activeBanks(bankType) 
        gradeList = []
        for b in activeBanks:
            if bankType == 'all' or b['type'] == bankType:
                submitted = self.queryJSreturn('SELECT * FROM bank WHERE bankId = %s AND userId = %s ORDER BY numRight DESC', 
                                               (b['bankId'], userId), getUserInfo=False)
                b['submitted'] = submitted
                sections = self.queryJSreturn('SELECT * FROM section WHERE bankId = %s AND userId = %s ORDER BY sectionIndex, numRight DESC', 
                                              (b['bankId'], userId), getUserInfo=False)
                b['sections'] = sections 
                gradeList.append(b)
        self.jsonReply({'grades': activeBanks})
        return gradeList
             
    
    def totalQuestionsAndWeightForSection(self, bankId, sectionIndexOrId):
        if isinstance(sectionIndexOrId, int):
            ui = self.queryOne('''SELECT MAX(totalQs) AS totalQs, MAX(weight) AS weight
                                    FROM section WHERE bankId = %s AND sectionIndex = %s
                                ''', (bankId, sectionIndexOrId))
        else:
            ui = self.queryOne('''SELECT MAX(totalQs) AS totalQs, MAX(weight) AS weight
                                    FROM section WHERE bankId = %s AND sectionId = %s
                                ''', (bankId, sectionIndexOrId))            
        if ui is None:
            return None
        
        if ui.weight is None:
            ui.weight = 1
        return ui
    
    def getSectionInfoForUser(self, bankId, sectionIndexOrId, userId):
        if isinstance(sectionIndexOrId, int):
            ui = self.query('''SELECT *
                                    FROM section WHERE bankId = %s AND sectionIndex = %s
                                    AND userId = %s
                                    ORDER BY numRight DESC, numMistakes
                                ''', (bankId, sectionIndexOrId, userId))
        else:
            ui = self.query('''SELECT * AS weight
                                    FROM section WHERE bankId = %s AND sectionId = %s
                                    AND userId = %s
                                    ORDER BY numRight DESC, numMistakes
                                ''', (bankId, sectionIndexOrId, userId))            
        bestTuple = None
        if ui is None or len(ui) == 0:
            return None
        
        bestTuple = ui[0]
        
        return bestTuple    

    def sectionsForUserBank(self, userId, bankId):
        '''
        For consolidating sections into a single grade
        
        select all sections, regardless of seed for a single bankId and make a statement.
        '''
        numSections = self.numSectionsForBank(bankId)
        if numSections is None:
            return
         
        totalQs = 0
        totalRight = 0
        totalWrong = 0
        totalUnanswered = 0
        totalMistakes = 0        
        
        for i in range(0, numSections):
            sectionInfo = self.totalQuestionsAndWeightForSection(bankId, i)
            pointsPossible = sectionInfo.totalQs * sectionInfo.weight
            bestAttempt = self.getSectionInfoForUser(bankId, i, userId)
            if bestAttempt:   
                numRight = bestAttempt.numRight * sectionInfo.weight
                numWrong = bestAttempt.numWrong * sectionInfo.weight
                numMistakes = bestAttempt.numMistakes * sectionInfo.weight
                numUnanswered = bestAttempt.numUnanswered * sectionInfo.weight
            else:
                numRight = 0
                numWrong = 0
                numMistakes = 0
                numUnanswered = pointsPossible
            
            totalQs += pointsPossible
            totalRight += numRight
            totalWrong += numWrong
            totalUnanswered += numUnanswered
            totalMistakes += numMistakes
                
            print(bestAttempt, pointsPossible, numRight)
        
        return BankResults(totalQs, totalRight, totalWrong, totalUnanswered, totalMistakes)

    
    def retrieveAnswer(self):
        uid = self.verifyGetId()
        if uid is None:
            return
        
        if ('seed' not in self.jsonForm or 'bankId' not in self.jsonForm):
            self.jsonReply({'success': False,
                            'login': True,
                            })
            return;

        
        seed = self.jsonForm['seed']
        bankId = self.jsonForm['bankId']
        
        sectionsIncluded = self.query('''SELECT DISTINCT(sectionIndex) AS si FROM question
            WHERE seed = %s AND bankId = %s AND userId = %s ORDER BY sectionIndex
        ''', (seed, bankId, uid))

        sectionDict = {};

        for r in sectionsIncluded:
            sectionIndex = r.si                    
            answerInfo = self.queryJSreturn('''SELECT answerStatus, storedAnswer, studentAnswer, 
                                        questionIndex, numMistakes FROM question 
                WHERE seed = %s AND bankId = %s AND sectionIndex = %s AND userId = %s ORDER BY questionIndex
            ''', (seed, bankId, sectionIndex, uid))
            sectionDict[sectionIndex] = answerInfo
        self.jsonReply({'success': True,
                        'login': True,
                        'sectionDict': sectionDict,
                        })

    ####----- admin tools....
    
    
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
                    self.gradesGetComments()
                elif jrFunc == 'viewBankGrades':
                    self.gradesViewBankGrades()
                elif jrFunc == 'listBanks':
                    self.getBanks()
                elif jrFunc == 'findUnsubmitted':
                    self.findUnsubmitted()
                elif jrFunc == 'randomCall':
                    self.randomCall()
                else:
                    self.jsonReply({'password': True,
                                    'error': 'illegal function: ' + jrFunc,
                                    })


    unsubmittedQuery = '''SELECT users.id AS userId FROM users 
                                   WHERE users.id NOT IN (SELECT userId FROM bank 
                                                          WHERE bank.bankId = %s) 
                                   AND users.enrolled = 'TRUE' ORDER BY users.last, users.first'''
    def findUnsubmitted(self):
        if 'bankId' not in self.jsonForm:
            self.jsonReply({'error': 'No bankId found in form!'
                            })
            return
        bank = self.jsonForm['bankId']
        q = self.queryJSreturn(self.unsubmittedQuery, (bank, ))
        self.jsonReply({'unsubmitted': q,})

    def gradesViewBankGrades(self):
        q = self.queryJSreturn('SELECT * FROM bank ORDER BY lastUpdated DESC')
        self.jsonReply({'password': True,
                        'grades': q,
                        'error': None,
                        })
        
        
    def gradesGetComments(self):
        recentComments = self.queryJSreturn('''SELECT comment, userId, lastUpdated, 
                 bankId, sectionId FROM comments ORDER BY lastUpdated DESC limit 20''')
        self.jsonReply({'password': True,
                        'comments': recentComments,
                        'error': None,
                        })

    def randomCall(self):
        if 'section' not in self.jsonForm:
            section = 2
        section = self.jsonForm['section']
        q = self.queryJSreturn('''SELECT id AS userId FROM users WHERE enrolled = 'TRUE' AND section = %s ''' % (section, ))
        import random
        random.shuffle(q)
        self.jsonReply({'students': q})


    ## commandline Tools...
    
    def consolidateSectionsForOneUser(self, userId, bankId):
        '''
        takes all the sections for one user and moves them into the bank. Run ONCE per user...
        '''
        res = self.sectionsForUserBank(userId, bankId)
        if res is None:
            return None
        
        timeInfo = self.getStartEndTimeForUserBank(userId, bankId)
        if timeInfo and timeInfo.startTime is not None:
            startTime = timeInfo.startTime
            endTime = timeInfo.endTime
        else:
            startTime = datetime.datetime(2014, 1, 1, 1, 1, 1)
            endTime = datetime.datetime(2015, 1, 1, 1, 1, 1)
        print (startTime, endTime)
        
        urlInfo = self.queryOne('''SELECT DISTINCT(url) FROM bank WHERE bankId = %s AND url IS NOT NULL LIMIT 1''',
                            (bankId, ))
        if urlInfo:
            url = urlInfo.url
        else:
            url = ""
        
        self.execute(
                '''REPLACE INTO bank (bankId, userId, 
                                    numRight, numWrong, numMistakes, numUnanswered,
                                    totalQs, startTime, endTime, seed, url
                                    )
                                VALUES (%s, %s,
                                        %s, %s, %s, %s,
                                        %s, %s, %s, -1, %s
                                        )
                ''', (bankId, userId, 
                      res.numRight, res.numWrong, res.numMistakes, res.numUnanswered,
                      res.totalQs, startTime, endTime, url
                        )
                )
        
    def consolidateBank(self, bankId):
        naughty = self.query(self.unsubmittedQuery, (bankId, ))
        for u in naughty:
            userId = u.userId
            self.consolidateSectionsForOneUser(userId, bankId)
            


    ## comments

    def sendComment(self):
        try:
            userId = self.getUserIdFromEmail()
        except M21JMysqlException:
            userId = 0
            
        j = self.jsonForm
        comment = j['comment']
        userInfo = self.getUserInfoFromId(userId)
        if userInfo is not None and 'first' in userInfo:
            subject = "New comment from " + userInfo['first'] + " " + userInfo['last']
            replyTo = userInfo['email']
        else:
            subject = "New comment"
            replyTo = None

        try:
            self.execute(
                '''INSERT INTO comments (bankId, sectionId, 
                                        userId, comment, seed
                                        )
                                VALUES (%s, %s,
                                        %s, %s, %s)
                ''', (j['bankId'], j['sectionId'],
                      userId, comment, j['seed']
                      )
                )
            self.jsonReply({'success': True})
        except Exception as e:
            self.err(e)
            self.jsonReply({'success': False})
            subject = "SERVER ERROR: " + subject
            
            raise e
        finally:            
            self.sendEmail(comment, {'subject': subject, 'replyTo': replyTo })


    def sendEmail(self, message="No message", options = {}):
        from email.mime.text import MIMEText
        import smtplib                    
        msg = MIMEText(message.encode('utf-8'), 'plain', 'utf-8')
        msg['To'] = ','.join(self.adminEmails)
        msg['From'] = self.profEmail
        
        if 'subject' in options:
            subject = options['subject']
        else:
            subject = 'New Message'
            
        subject = '[21m.051 m21theory] ' + subject
        msg['Subject'] = subject
        
        if 'replyTo' in options and options['replyTo'] is not None:
            msg['Reply-To'] = options['replyTo']        
        
        s = smtplib.SMTP(self.smtpHost)
        s.sendmail(self.profEmail, self.adminEmails, msg.as_string())
        s.quit()
        
    ### html forms
    
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

    def addUser(self):
        self.title = 'Add User'        
        reply = ""
        if self.jsonForm is None or 'first' not in self.jsonForm:
            self.printHeader()
            print(r'''
        <script>
        require(['m21theory'], function () {
           m21theory.style.apply({loadCss: false});
           var $t = $("#testBank");
           $t.append('<h1>Add User</h1><hr/><p>Enter your information below.</p>');
           $t.append('<table><tr><td>First Name:</td><td><input type="text" id="first" size=20 class="lightInput" /></td></tr>' + 
               '<tr><td>Last Name:</td><td><input type="text" id="last" size=20 class="lightInput" /></td></tr>' + 
               '<tr><td>Email:</td><td><input type="text" id="email" size=20 class="lightInput" /></td></tr>' + 
               '<tr><td>Password:</td><td><input type="password" id="password" size=20 class="lightInput" /></td></tr>' + 
               '<tr><td>Password Again:</td><td><input type="password" id="passwordVerify" size=20 class="lightInput" /></td></tr>' + 
               '</table>');
           var $b = $('<button class="lightInput">Register</button>');
           $b.click( function (e) {  
               var al = m21theory.feedback.alert;
               var newPw = $('#password').val();
               var newPwVerify = $('#passwordVerify').val();
               var first = $('#first').val();
               var last = $('#last').val();
               var email = $('#email').val();
               if (newPw != newPwVerify) {
                   al("Your passwords do not match! Re verify!", 'alert');
               } else if (last == '') {
                   al("You need to give a last name.", 'alert');
               } else if (first == '') {
                   al("You need to give a first name.", 'alert');
               } else if (newPw.length < 5) {
                   al("Please choose a longer password.", 'alert');
               } else if (email.indexOf('@') < 1 || email.indexOf('.') < 2) {
                   al("Something seems screwy with your email.", 'alert');
               } else {
                   m21theory.serverSettings.makeAjax({
                          'password': newPw,
                          'first': first,
                          'last': last,
                          'email': email,
                       },
                       { 
                       url: m21theory.serverSettings.addUser,
                       success: function (json) {
                               m21theory.feedback.alert(json.msg, json.type);
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
            password = self.jsonForm['password']
            last = self.jsonForm['last']
            first = self.jsonForm['first']
            email = self.jsonForm['email']
            
            exists = self.queryOne('SELECT email FROM users WHERE email = %s', (email, ))
            #self.err(exists)
            if exists:
                reply = {'msg': 'This email is already in use; if you want to change your password, use the change password form',
                         'type': 'alert'}
                self.jsonReply(reply)
                return
            obfuscated = codecs.encode(password, 'rot_13') # yeah...
            try:
                self.execute("INSERT INTO users (first, last, email, password) VALUES (%s, %s, %s, %s)", 
                             (first, last, email, obfuscated)
                             )
                reply = {'msg': 'Your username has been successfully added',
                         'type': 'ok'}
                self.jsonReply(reply)
            except :
                reply = {'msg': 'There was an error in updating the database.  Apologies! Please contact the prof and try again later.',
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

    def printFooter(self):
        print ('''</body></html>''')


if (__name__ == '__main__'):
#     m = M21JMysql(db='cuthbert')
#     cur = m.con.cursor()
#     cur.execute("SELECT * FROM countries")
#     rows = cur.fetchall()
#     for row in rows:
#         print(row)
    m = M21JMysql(db='fundamentals', host='zachara.mit.edu')
    #print(m.numSectionsForBank('ps02a'))
    #print(m.totalQuestionsAndWeightForSection('ps02a', 'noteMidi'))
    #print(m.sectionsForUserBank(32, 'ps01'))
    #print(m.getStartEndTimeForUserBank(32, 'ps01'))
    #m.consolidateSectionsForOneUser(9, 'ps02a')
    print(m.consolidateBank('ps04_flcg'))
    #print(m.activeBanks('ps'))
    #print("Starting...")
    #print(m.gradesByType(3))
