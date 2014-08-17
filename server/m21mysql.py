import getpass
import logging
import sys
import os

import MySQLdb as mdb

# for mac, use
# http://stackoverflow.com/questions/1448429/how-to-install-mysqldb-python-data-access-library-to-mysql-on-mac-os-x#1448476
#
# don't forget to symlink!

class M21JMysql(object):
    
    def __init__(self, form=None, host='localhost', user='cuthbert', db='fundamentals'):
        self.form = form
        self.host = host
        self.user = user
        self.db = db
        
        self.hostpath = 'http://web.mit.edu/music21/music21j'
        
        self.title = "Music21j Project"

        self.pw = None
        self.con = None
        self.mysqlVersion = None
    
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
            print("Error %d: %s" % (e.args[0], e.args[1]))
            sys.exit(1)

        self.con = con
            
        
    def getPW(self):  
        username = getpass.getuser()
        userdir = os.path.expanduser("~" + username)
        
        logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)
        logging.debug(username)
        
        mysqlPasswordFile = userdir + os.path.sep + '.music21j_password'
        if not os.path.exists(mysqlPasswordFile):
            raise Exception("Cannot read password file!")
        
        with open(mysqlPasswordFile) as f:
            pw = f.read().strip()
        return pw

    def changePassword(self):
        self.connect()
        self.printHeader()        
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
        print(self.mysqlVersion)
        
    def printHTTPHeader(self):
        print("Content-Type: text/html")
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
    m.connect()
    cur = m.con.cursor()
    cur.execute("SELECT * FROM countries")
    rows = cur.fetchall()
    for row in rows:
        print(row)
    
