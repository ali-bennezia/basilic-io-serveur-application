#! /bin/bash
source ${HOME}/.bashrc
SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")
cd $SCRIPTPATH
export NODE_ENV=production
npm start

