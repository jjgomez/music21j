#!/usr/bin/python

import cgi_helper
import cgitb
import sys

try:

    f = cgi_helper.form()
    m = cgi_helper.m21my(f)
    m.submitBank()

except Exception as e:
    cgitb.handler(sys.exc_info())
