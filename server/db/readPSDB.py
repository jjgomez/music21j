import sqlite3

try:
    conn = sqlite3.connect("/Library/WebServer/Documents/m21j/db/grades2013fa.db")
except sqlite3.OperationalError:
    conn = sqlite3.connect("grades2013fa.db")


c = conn.cursor()

try:
    for row in c.execute('SHOW TABLES'): #'SELECT * FROM receivedTest ORDER BY submitDateText DESC'):
        print row
except IOError:
    pass #  | head, or something like that...

conn.close()
