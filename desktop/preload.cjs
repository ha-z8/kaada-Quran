'use strict';
const {contextBridge}=require('electron');
contextBridge.exposeInMainWorld('wirdDesktop',Object.freeze({offlineAudio:true,platform:'windows'}));
