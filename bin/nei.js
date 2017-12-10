#!/usr/bin/env node

'use strict';
var util = require('../lib/util/util');
util.checkNodeVersion();
var main = require('../main');
let logger = require('../lib/util/logger');
let Args = require('../lib/util/args');
let inquirer = require('inquirer');

/**
 * 处理args中的数组情况
 * @param config
 */
function formatArrayArgs(config) {
  ["ids", "tags", "add"].forEach(key => {
    if (config[key]) {
      try {
        if (key == "tags") {
          config[key] = config[key].split(",");
        } else {
          config[key] = JSON.parse(`[${config[key]}]`);
        }
      } catch (e) {
        logger.log("error", {
          message: `输入${key}有误，请确定输入为数字，或以','分割的数字`
        });
        process.exit(-1); // 直接退出进程
      }
    }
  });
}

var options = {
  package: require('../package.json'),
  message: require('./config.js'),
  exit: function (code) {
    if (typeof (code) === 'undefined') {
      code = 0;
    }
    process.exit(code);
  },
  log: function (msg) {
    console.log(msg);
  },
  setLogLevel: function (logLevel) { // 设置logger的显示级别，因为使用单例，共享logger对象
    logger.logger.setLevel(logLevel);
  },
  build: function (event) {
    var action = 'build';
    var config = event.options || {};
    formatArrayArgs(config);
    config = this.format(action, config);
    if (!config.key && !config.specKey) {
      this.log(`错误: 缺少项目的唯一标识 key, 请到 NEI 网站上的相应项目的"工具设置"中查看该 key 值`);
      this.show(action);
    } else {
      main.build(this, action, config);
    }
  },
  update: function (event) {
    var action = 'update';
    var config = event.options || {};
    formatArrayArgs(config);
    config = this.format(action, config);

    main.update(this, action, config);
  },
  server: function (event) {
    var action = 'server';
    var config = event.options || {};
    config = this.format(action, config);
    config.action = action;

    if(config['mode-on']){
      inquirer
      .prompt([{
        type: 'list',
        message: '请选择开发模式:\n',
        name: 'mode',
        choices: [{
            name: '1. 本地mock模式 + pc',
            value: 1
          },
          {
            name: '2. 远程mock模式 + pc',
            value: 2
          },
          {
            name: '3. 远程mock模式 + mobile',
            value: 3
          }
        ]
      }])
      .then(function (value) {
        switch (value.mode) {
          case 1:
            config['proxy-routes'] = false;
            config['proxy-model'] = false;
            config['user-agent'] = 'pc';
            break;
          case 2:
            config['proxy-routes'] = true;
            config['proxy-model'] = true;
            config['user-agent'] = 'pc';
            break;
          case 3:
            config['proxy-routes'] = true;
            config['proxy-model'] = true;
            config['user-agent'] = 'mobile';
            break;
        }
        main.server(config);
      });
    }else{
      main.server(config);
    }
  },
  template: function (event) {
    var action = 'template';
    var config = event.options || {};
    var data = Object.assign({}, config);
    config = this.format(action, config, true); // 最后一个true表明需要使用默认参数填充
    ["p", "o", "d", "b", "w"].forEach((item) => {
      delete data[item];
    });
    main.template(config, data);
  }
};

var args = new Args(options);
// do command
args.exec(process.argv.slice(2));