import cgitb
cgitb.enable()
import sys
import os
import cgi

parentPath = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append(parentPath)

import m21mysql
m21my = m21mysql.M21JMysql
form = cgi.FieldStorage