#!/bin/bash
# يوقف الخادمين بمطابقة اسم العمليّة (comm) لا سطرِ الأوامر — كي لا يقتل نفسه
me=$$
ps -eo pid=,comm=,args= | while read -r pid comm args; do
  [ "$pid" = "$me" ] && continue
  case "$comm" in
    next-server*) kill "$pid" 2>/dev/null && echo "stopped next ($pid)";;
    node) case "$args" in *mock-supabase.mjs*) kill "$pid" 2>/dev/null && echo "stopped mock ($pid)";; esac;;
  esac
done
