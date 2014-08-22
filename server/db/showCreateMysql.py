#!/usr/bin/env python

import sys
import os

thisPath = os.path.dirname(__file__)
parentPath = os.path.abspath(os.path.join(thisPath, ".."))
sys.path.append(parentPath)

import m21mysql
m = m21mysql.M21JMysql()
pw = m.getMysqlPW()

path = "/usr/local/mysql/bin/mysqldump"
args = " -d --password=" + pw
db = 'fundamentals'
outPath = 'create_MYSQL.sql'

os.system(path + ' ' + args + ' ' + db + " > " + outPath)

