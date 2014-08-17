#!/usr/bin/python

# Import smtplib for the actual sending function
import smtplib
import cgi
import json
import sqlite3
import sys
import logging
import getpass

username = getpass.getuser()

logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)
logging.debug(username)


form = cgi.FieldStorage()
if 'first' in form:
    first = form['first'].value
else:
    first = "unk"

if 'last' in form:
    last = form['last'].value
else:
    last = "unkL"

if 'totalTime' in form:
    totalTime = form['totalTime'].value
else:
    totalTime = -1

if 'comments' in form:
    comments = form['comments'].value
else:
    comments = "no comment"


if 'assignmentId' in form:
    assignmentId = form['assignmentId'].value
else:
    assignmentId = "Intervals"

if 'profEmail' in form:
	profEmail = form['profEmail'].value + "@mit.edu"
else:
	profEmail = "cuthbert@post.harvard.edu"

if 'information' in form:
    infoString = form['information'].value
else:
	infoString = "{}"

if 'testId' in form:
	testId = form['testId'].value
else:
	testId = "bank1"
	
infoDict = json.loads(infoString)


# Import the email modules we'll need
from email.mime.text import MIMEText

# Create a text/plain message
msgAsText = ("A completed assignment [%s] was sent by"  
			 " %s %s in %s seconds, with comments: %s" % (
			 	assignmentId, first, last, totalTime, comments
			 	) )
msgAsText += repr(infoDict);

import time
timeStr = int(time.time())

msgDB = comments + "..." + repr(infoDict)

dbFN = '../db/grades2013fa.db'

# commit
conn = sqlite3.connect(dbFN)
c = conn.cursor()
c.execute('''INSERT INTO receivedTest VALUES 
             (?, ?, ?, ?, ?, ?, ?, ?)''', 
          [timeStr, first, last, testId, assignmentId, totalTime, 
           comments, repr(infoDict)] )

conn.commit()
conn.close()

# check commit...
conn2 = sqlite3.connect(dbFN)
c = conn2.cursor()
c.execute('SELECT * FROM receivedTest WHERE submitDateText = ?', [timeStr])
receivedLine = c.fetchone()
conn2.close()

error = False
if ( receivedLine == [] ):
    error = True
elif ( receivedLine[0] != timeStr or
     receivedLine[1] != first or
     receivedLine[-1] != repr(infoDict) ):
    error = True

if (error == False):
    print "Content-type: application/json\n"
    print '{"reply": "Got it! you are now all set.  If you are cautious print this page as a pdf for your records...this is brand new and there may be some bugs"}'
else:
    print "Content-type: application/json\n"
    print '{"reply": "<span style=\'font-size: 30px\'>An Error Arose in Submission! Please Print this page as a PDF and email cuthbert@mit.edu immediately!</span>"}'
