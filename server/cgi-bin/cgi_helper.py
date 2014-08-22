import cgitb
def noRest():
    return "Content-Type: text/html\n\n<html>\n"
cgitb.reset = noRest
oldhtml = cgitb.html
def newHTML((etype, evalue, etb), context=5):
    x = oldhtml((etype, evalue, etb), context)
    return x + "\n</body></html>\n"
cgitb.html = newHTML

import sys
import os
import cgi

parentPath = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append(parentPath)

import m21mysql
m21my = m21mysql.M21JMysql
form = cgi.FieldStorage