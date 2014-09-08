#!/usr/bin/python

import cgi_helper
import cgitb
import sys

# Master program for all Admin related activities -- first checks to see
# if the user is an admin then delegates to a sub function.

try:
    f = cgi_helper.form()
    m = cgi_helper.m21my(f)
    m.gradebook()

except Exception as e:
    cgitb.handler(sys.exc_info())
