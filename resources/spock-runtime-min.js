
var SPOCK={STACKSIZE:100,THREADSLICE:10,TRACELENGTH:32};SPOCK.modules={};SPOCK.symbolTable={};SPOCK.stack=0;SPOCK.limit=SPOCK.STACKSIZE;SPOCK.debug=false;SPOCK.running=false;SPOCK.runHook=[];SPOCK.inBrowser="document"in this;SPOCK.global=this;SPOCK.Continuation=function(func,args){this.k_callee=func;this.k_arguments=args;};SPOCK.Result=function(val){this.value=val;};SPOCK.Symbol=function(name){this.name=name;this.plist={};};SPOCK.Pair=function(car,cdr){this.car=car;this.cdr=cdr;};SPOCK.String=function(chars){if(typeof chars==="string"){this.parts=[chars];this.length=chars.length;}
else if(typeof chars==="number")this.parts=[chars.toString()];else this.parts=chars;};SPOCK.Char=function(str){this.character=str.charAt(0);};SPOCK.Port=function(direction,methods){var port=this;var read=methods.read||function(){SPOCK.error("reading from non-input port",port);};function doread(n){if(n===0)return"";else if(this.peeked){var p=this.peeked;this.peeked=false;if(n===1)return p;else return p+read(n-1);}
else return read(n);}
this.peeked=false;this.direction=direction;this.read=doread;this.write=methods.write||function(){SPOCK.error("writing to non-output port",port)};this.close=methods.close||function(){};this.flush=methods.flush||function(){};this.ready=methods.ready||function(){return true;};this.closed=false;};SPOCK.Promise=function(thunk){this.thunk=thunk;};SPOCK.EndOfFile=function(){};SPOCK.EOF=new SPOCK.EndOfFile();SPOCK.check=function(val,type,loc){if(typeof type==="function"&&val instanceof type)return val;if(typeof val===type)return val;else SPOCK.error((loc?"("+loc+") ":"")+"bad argument type"+
(typeof type==="string"?" - expected `"+type+"'":""),val);};SPOCK.intern=function(str){var old=SPOCK.symbolTable[str];if(old)return old;else return SPOCK.symbolTable[str]=new SPOCK.Symbol(str);};SPOCK.stringify=function(x,readable){if(readable===undefined)readable=true;if(typeof x==="function")return"#<procedure>";else if(x===undefined)return"#<undefined>";else if(x===null)return"()";else if(x instanceof SPOCK.Continuation)return"#<continuation>";else if(x instanceof SPOCK.Symbol)return x.name;else if(x instanceof SPOCK.Pair){var str="(";var f=false;for(var p=x;p!==null&&p instanceof SPOCK.Pair;p=p.cdr){if(f)str+=" ";str+=SPOCK.stringify(p.car,readable);f=true;}
if(p!==null)str+=" . "+SPOCK.stringify(p,readable);return str+")";}
else if(x instanceof Array){var str="#(";var f=false;for(var i in x){if(f)str+=" ";str+=SPOCK.stringify(x[i],readable);f=true;}
return str+")";}
else if(x instanceof SPOCK.String){if(readable)
return"\""+x.normalize()+"\"";else return x.normalize();}
else if(x instanceof SPOCK.Char){if(readable)return x.character;switch(x.character){case"\n":return"#\\newline";case"\t":return"#\\tab";case"\r":return"#\\return";case" ":return"#\\space";default:return"#\\"+x.character;}}
else if(x instanceof SPOCK.Port)
return"#<"+x.direction+" port"+
(x.name?(" \""+x.name+"\">"):">");else if(x instanceof SPOCK.Promise)return"#<promise>";else if(x instanceof SPOCK.EndOfFile)return"#<eof>";else return x.toString();};SPOCK.error=function(msg){var args=Array.prototype.splice.call(arguments,1);function argstr(x){return SPOCK.stringify(x,true);}
if(args.length>0)
msg=msg+":\n  "+SPOCK.map(argstr,args).join("\n  ");throw new Error(msg);};if(this.quit)SPOCK.exit=quit;else SPOCK.exit=function(code){SPOCK.error("no suitable primitive available for `exit'");};SPOCK.String.prototype.normalize=function(){if(this.parts.length===0)return"";this.parts=[this.parts.join("")];return this.parts[0];};SPOCK.jstring=function(x){if(typeof x==="string")return x;else if(x instanceof SPOCK.String)return x.normalize();else return x;};SPOCK.list=function(){var lst=null;var len=arguments.length;for(var i=len-1;i>=0;--i)
lst=new SPOCK.Pair(arguments[i],lst);return lst;};SPOCK.length=function(lst){for(var n=0;lst instanceof SPOCK.Pair;++n)
lst=lst.cdr;return n;};SPOCK.map=function(func,array){var len=array.length;var a2=new Array(len);for(var i in array)
a2[i]=func(array[i]);return a2;};SPOCK.eqvp=function(x,y){if(x===y)return true;else if(x instanceof SPOCK.Char)
return y instanceof SPOCK.Char&&x.character===y.character;else return false;};SPOCK.equalp=function(x,y){if(x===y)return true;else if(x instanceof SPOCK.Pair)
return y instanceof SPOCK.Pair&&SPOCK.equalp(x.car,y.car)&&SPOCK.equalp(x.cdr,y.cdr);else if(x instanceof Array){var len=x.length;if(!(y instanceof Array)||y.length!=len)return false;for(var i=0;i<len;++i){if(!SPOCK.equalp(x[i],y[i]))return false;}
return true;}
else if(x instanceof SPOCK.Char)
return y instanceof SPOCK.Char&&x.characters===y.characters;else if(x instanceof SPOCK.String){var s1=x.normalize();if(y instanceof SPOCK.String)return s1===y.normalize();else if(typeof y==='string')return s1===y;else return false;}
else if(typeof x==='string'){if(y instanceof SPOCK.String)return x===y.normalize();else if(typeof y==='string')return x===y;else return false;}
else return false;};SPOCK.count=function(args,loc){if(--SPOCK.stack<=0)
return new SPOCK.Continuation(args.callee,Array.prototype.slice.call(args));else return false;};SPOCK.rest=function(args,count,loc){var rest=null;SPOCK.count(args,loc);for(var i=args.length-1;i>=count;--i)
rest=new SPOCK.Pair(args[i],rest);return rest;};SPOCK.statistics=function(){};SPOCK.run=function(func){function terminate(result){return new SPOCK.Result(result);}
var k=terminate;var args=[k].concat(Array.prototype.slice.call(arguments,1));var oldstack=SPOCK.stack;var oldlimit=SPOCK.limit;var oldrunning=SPOCK.running;SPOCK.limit=Math.max(10,oldlimit-oldstack);SPOCK.stack=SPOCK.limit;SPOCK.running=true;function restore(){SPOCK.stack=oldstack;SPOCK.limit=oldlimit;SPOCK.running=oldrunning;if(!oldrunning){for(var i in SPOCK.runHook)
(SPOCK.runHook[i])(false);}}
var result;if(!oldrunning){for(var i in SPOCK.runHook)
(SPOCK.runHook[i])(true);}
while(true){result=func.apply(SPOCK.global,args);if(result instanceof SPOCK.Continuation){SPOCK.stack=SPOCK.STACKSIZE;func=result.k_callee;args=result.k_arguments;}
else if(result instanceof SPOCK.Result){restore();return result.value;}
else{restore();SPOCK.error("unexpected return of non-continuation",result);}}
return result;};SPOCK.callback=function(proc){return function(){var args=Array.prototype.slice.call(arguments);args.unshift(proc);return SPOCK.run.apply(this,args);};};SPOCK.callbackMethod=function(proc){var g=this;return function(){var args=Array.prototype.slice.call(arguments);args.unshift(this);args.unshift(proc);return SPOCK.run.apply(g,args);};};SPOCK.go=function(proc){(SPOCK.callback(proc))();};if("java"in this){SPOCK.makeJavaInputPort=function(jp){return new SPOCK.Port("input",{read:function(n){var buffer="";while(n--){var b=jp.read();if(b===-1)break;else buffer+=String.fromCharCode(b);}
return buffer===""?SPOCK.EOF:buffer;},close:function(){jp.close();}});};SPOCK.makeJavaOutputPort=function(jp){return new SPOCK.Port("output",{write:function(s){var len=s.length;for(var i=0;i<len;++i)
jp.write(s.charCodeAt(i));},flush:function(){jp.flush();},close:function(){jp.close();}});};SPOCK.log=function(){java.lang.System.err.println(Array.prototype.slice.call(arguments).join(""));};SPOCK.stdin=SPOCK.makeJavaInputPort(java.lang.System["in"]);SPOCK.stdout=SPOCK.makeJavaOutputPort(java.lang.System.out);SPOCK.stderr=SPOCK.makeJavaOutputPort(java.lang.System.err);SPOCK.stderr.name="[stderr]";}
else{if("console"in this)SPOCK.log=console.log;else if(SPOCK.inBrowser)
SPOCK.log=function(){var msg=arguments.join(" ");if(msg.charAt(msg.length-1)=="\n")
msg=msg.substring(0,msg.length-1);this.defaultStatus=msg;};else if("print"in this)SPOCK.log=print;else if(typeof process!==undefined)SPOCK.log=console.log;else SPOCK.error("no suitable output primitive available");(function(){var buffer=[];function flush(){if(buffer.length>0){SPOCK.log(buffer.join(""));buffer=[];}}
function write(s){var parts=SPOCK.stringify(s,false).split("\n");var len=parts.length-1;if(len>0){buffer.push(parts[0]);flush();if(len>1){for(var i=1;i<len;++i)
SPOCK.log(parts[i]);}
buffer.push(parts[len]);}
else buffer.push(parts[0]);}
SPOCK.stdout=new SPOCK.Port("output",{write:write,flush:flush});var inp;var ibuffer="";if(this.prompt){inp=function(n){while(true){if(ibuffer.length<=n){var part=ibuffer.slice(0,n);ibuffer=ibuffer.slice(n);return part;}
var input=prompt("Expecting input for "+this.toString());if(input===null)return SPOCK.EOF;else ibuffer+=input;}};}
else{inp=function(n){SPOCK.error("no input possible for standard input port");};}
SPOCK.stdin=new SPOCK.Port("input",{read:inp});SPOCK.stderr=SPOCK.stdout;})();}
SPOCK.stdin.name="[stdin]";SPOCK.stdout.name="[stdout]";SPOCK.flush=function(){SPOCK.stdout.flush();if(SPOCK.stderr!==SPOCK.stdout)
SPOCK.stderr.flush();SPOCK.statistics();};if(this.gc)SPOCK.gc=gc;else SPOCK.gc=function(){};SPOCK.openInputUrlHook=function(url){SPOCK.error("can not open",url);};SPOCK.openOutputUrlHook=function(url){SPOCK.error("can not open",url);};if("java"in this){SPOCK.openInputFile=function(filename){var stream;try{stream=new java.io.FileInputStream(filename);}
catch(e){SPOCK.error(e.message);}
var port=SPOCK.makeJavaInputPort(stream);port.name=filename;return port;};SPOCK.openOutputFile=function(filename){var stream;try{stream=new java.io.FileOutputStream(filename);}
catch(e){SPOCK.error(e.message);}
var port=SPOCK.makeJavaOutputPort(stream);port.name=filename;return port;};SPOCK.fileExists=function(filename){return(new java.io.File(filename)).exists();};}
else{if(SPOCK.inBrowser){SPOCK.openInputFile=function(filename){if(filename.match(/^[a-z0-9]+:/))
return SPOCK.openInputUrlHook(filename);var cookies=document.cookie.split("; ");var buffer=null;for(var i=0;i<cookies.length;++i){var c=cookies[i];var p=c.indexOf("=");if(filename===c.substring(0,p)){buffer=c.substring(p+1);break;}}
if(!buffer)SPOCK.error("can not open file",filename);var pos=0;return new SPOCK.Port("input",{read:function(n){if(pos>=buffer.length)return SPOCK.EOF;else if(pos+len>=buffer.length)
return buffer.substring(pos);var p1=pos;pos+=n;return buffer.substring(p1,p1+n);},ready:function(){return pos<buffer.length;}});};SPOCK.openOutputFile=function(filename,expiry){if(filename.match(/^[a-z0-9]+:/))
return SPOCK.openOutputUrlHook(filename);return new SPOCK.Port("output",{write:function(s){buffer+=s;},close:function(){var now=(new Date()).getTime();var exp=now+(expiry||(1000*60*60*24*365));document.cookie=filename+"="+encodeURIComponent(buffer)+"; expires="+(new Date(exp)).toGMTString();}});};}
else{SPOCK.openInputFile=function(filename){SPOCK.error("file-I/O not available");}
SPOCK.openOutputFile=function(filename){SPOCK.error("file-I/O not available");}}
SPOCK.fileExists=function(filename){SPOCK.error("`file-exists?' not available");};}
if("document"in this){SPOCK.load=function(url,k){var script=document.createElement("script")
script.type="text/javascript";k=k||function(){};if(script.readyState){script.onreadystatechange=function(){if(script.readyState=="loaded"||script.readyState=="complete"){script.onreadystatechange=null;k(url);}};}
else{script.onload=function(){k(url);};}
script.src=url;document.getElementsByTagName("head")[0].appendChild(script);};}
else if("load"in this){SPOCK.load=function(filename,k){load(filename);if(k)k(filename);};}
var t1350=function(k1097){var t1351=function(k1098,t1){var t1=SPOCK.rest(arguments,1);loop:while(true){return k1098(t1);}};____25list=t1351;var t1353=function(K){SPOCK.count(arguments,'values');return K.apply(SPOCK.global,Array.prototype.slice.call(arguments,1));};___values=t1353;var t1354=function(K){SPOCK.count(arguments,'call-with-values');var thunk=arguments[1];var proc=arguments[2];function k2(){var args=Array.prototype.slice.call(arguments);args.unshift(K);return proc.apply(SPOCK.global,args);}
return thunk(k2);};___call_2dwith_2dvalues=t1354;var t1355=function(K){SPOCK.count(arguments,'%call-with-saved-values');var t1=arguments[1];var t2=arguments[2];var args;function k2(){return K.apply(SPOCK.global,args);}
function k1(){args=Array.prototype.slice.call(arguments);return t2(k2);}
return t1(k1);};____25call_2dwith_2dsaved_2dvalues=t1355;var t1356=function(k1099,t2){var r=SPOCK.count(arguments);if(r)return r;var t3=undefined;var t1357=function(k1100,t4,t5){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1359=null;var t1358=(t4)===(t1359);var t6=t1358;var t1360;if(t6!==false){return k1100(t6);t1360=undefined;}
else{var t1362=(t4)instanceof SPOCK.Pair;var t975=t1362;var t1363;if(t975!==false){var t1364=t4.cdr;var t11=t1364;var t1366=null;var t1365=(t11)===(t1366);var t13=t1365;var t1367;if(t13!==false){return k1100(t13);t1367=undefined;}
else{var t1369=(t11)instanceof SPOCK.Pair;var t976=t1369;var t1370;if(t976!==false){var t1371=t11.cdr;var t18=t1371;var t1372=t5.cdr;var t19=t1372;var t1373=(t18)===(t19);var t22=t1373;var t1374;if(t22!==false){t1374=false;}
else{t1374=true;}
var t977=t1374;var t1375;if(t977!==false){var t1376=t18;var t1377=t19;t4=t1376;t5=t1377;continue loop;t1375=undefined;}
else{return k1100(false);t1375=undefined;}
t1370=t1375;}
else{return k1100(false);t1370=undefined;}
t1367=t1370;}
t1363=t1367;}
else{return k1100(false);t1363=undefined;}
t1360=t1363;}}};t3=t1357;return t3(k1099,t2,t2);};___list_3f=t1356;var t1382=function(k1101,t25){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1383=t25.car;var t27=t1383;var t1384=t27.car;var t26=t1384;var t1385=t26.car;return k1101(t1385);}};___caaar=t1382;var t1387=function(k1102,t32){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1388=t32.cdr;var t34=t1388;var t1389=t34.car;var t33=t1389;var t1390=t33.car;return k1102(t1390);}};___caadr=t1387;var t1392=function(k1103,t39){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1393=t39.car;var t41=t1393;var t1394=t41.cdr;var t40=t1394;var t1395=t40.car;return k1103(t1395);}};___cadar=t1392;var t1397=function(k1104,t46){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1398=t46.cdr;var t48=t1398;var t1399=t48.cdr;var t47=t1399;var t1400=t47.car;return k1104(t1400);}};___caddr=t1397;var t1402=function(k1105,t53){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1403=t53.car;var t55=t1403;var t1404=t55.car;var t54=t1404;var t1405=t54.cdr;return k1105(t1405);}};___cdaar=t1402;var t1407=function(k1106,t60){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1408=t60.cdr;var t62=t1408;var t1409=t62.car;var t61=t1409;var t1410=t61.cdr;return k1106(t1410);}};___cdadr=t1407;var t1412=function(k1107,t67){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1413=t67.car;var t69=t1413;var t1414=t69.cdr;var t68=t1414;var t1415=t68.cdr;return k1107(t1415);}};___cddar=t1412;var t1417=function(k1108,t74){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1418=t74.cdr;var t76=t1418;var t1419=t76.cdr;var t75=t1419;var t1420=t75.cdr;return k1108(t1420);}};___cdddr=t1417;var t1422=function(k1109,t81){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1423=t81.car;var t84=t1423;var t1424=t84.car;var t83=t1424;var t1425=t83.car;var t82=t1425;var t1426=t82.car;return k1109(t1426);}};___caaaar=t1422;var t1428=function(k1110,t90){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1429=t90.cdr;var t93=t1429;var t1430=t93.car;var t92=t1430;var t1431=t92.car;var t91=t1431;var t1432=t91.car;return k1110(t1432);}};___caaadr=t1428;var t1434=function(k1111,t99){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1435=t99.car;var t102=t1435;var t1436=t102.cdr;var t101=t1436;var t1437=t101.car;var t100=t1437;var t1438=t100.car;return k1111(t1438);}};___caadar=t1434;var t1440=function(k1112,t108){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1441=t108.cdr;var t111=t1441;var t1442=t111.cdr;var t110=t1442;var t1443=t110.car;var t109=t1443;var t1444=t109.car;return k1112(t1444);}};___caaddr=t1440;var t1446=function(k1113,t117){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1447=t117.car;var t120=t1447;var t1448=t120.car;var t119=t1448;var t1449=t119.cdr;var t118=t1449;var t1450=t118.car;return k1113(t1450);}};___cadaar=t1446;var t1452=function(k1114,t126){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1453=t126.cdr;var t129=t1453;var t1454=t129.car;var t128=t1454;var t1455=t128.cdr;var t127=t1455;var t1456=t127.car;return k1114(t1456);}};___cadadr=t1452;var t1458=function(k1115,t135){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1459=t135.car;var t138=t1459;var t1460=t138.cdr;var t137=t1460;var t1461=t137.cdr;var t136=t1461;var t1462=t136.car;return k1115(t1462);}};___caddar=t1458;var t1464=function(k1116,t144){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1465=t144.cdr;var t147=t1465;var t1466=t147.cdr;var t146=t1466;var t1467=t146.cdr;var t145=t1467;var t1468=t145.car;return k1116(t1468);}};___cadddr=t1464;var t1470=function(k1117,t153){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1471=t153.car;var t156=t1471;var t1472=t156.car;var t155=t1472;var t1473=t155.car;var t154=t1473;var t1474=t154.cdr;return k1117(t1474);}};___cdaaar=t1470;var t1476=function(k1118,t162){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1477=t162.cdr;var t165=t1477;var t1478=t165.car;var t164=t1478;var t1479=t164.car;var t163=t1479;var t1480=t163.cdr;return k1118(t1480);}};___cdaadr=t1476;var t1482=function(k1119,t171){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1483=t171.car;var t174=t1483;var t1484=t174.cdr;var t173=t1484;var t1485=t173.car;var t172=t1485;var t1486=t172.cdr;return k1119(t1486);}};___cdadar=t1482;var t1488=function(k1120,t180){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1489=t180.cdr;var t183=t1489;var t1490=t183.cdr;var t182=t1490;var t1491=t182.car;var t181=t1491;var t1492=t181.cdr;return k1120(t1492);}};___cdaddr=t1488;var t1494=function(k1121,t189){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1495=t189.car;var t192=t1495;var t1496=t192.car;var t191=t1496;var t1497=t191.cdr;var t190=t1497;var t1498=t190.cdr;return k1121(t1498);}};___cddaar=t1494;var t1500=function(k1122,t198){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1501=t198.cdr;var t201=t1501;var t1502=t201.car;var t200=t1502;var t1503=t200.cdr;var t199=t1503;var t1504=t199.cdr;return k1122(t1504);}};___cddadr=t1500;var t1506=function(k1123,t207){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1507=t207.car;var t210=t1507;var t1508=t210.cdr;var t209=t1508;var t1509=t209.cdr;var t208=t1509;var t1510=t208.cdr;return k1123(t1510);}};___cdddar=t1506;var t1512=function(k1124,t216){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1513=t216.cdr;var t219=t1513;var t1514=t219.cdr;var t218=t1514;var t1515=t218.cdr;var t217=t1515;var t1516=t217.cdr;return k1124(t1516);}};___cddddr=t1512;var t1518=function(k1125,t225){var t225=SPOCK.rest(arguments,1);var t1520=null;var t1519=(t225)===(t1520);var t978=t1519;var t1521;if(t978!==false){var t1522=null;return k1125(t1522);t1521=undefined;}
else{var t229=undefined;var t1524=function(k1126,t230){var r=SPOCK.count(arguments);if(r)return r;var t1525=t230.cdr;var t231=t1525;var t1527=null;var t1526=(t231)===(t1527);var t979=t1526;var t1528;if(t979!==false){var t1529=t230.car;return k1126(t1529);t1528=undefined;}
else{var t236=undefined;var t1531=function(k1127,t237){var r=SPOCK.count(arguments);if(r)return r;var t1532=(t237)instanceof SPOCK.Pair;var t980=t1532;var t1533;if(t980!==false){var t1534=t237.car;var t239=t1534;var t1535=function(t1128){var t240=t1128;var t1536=new SPOCK.Pair(t239,t240);return k1127(t1536);};var t1538=t237.cdr;return t236(t1535,t1538);t1533=undefined;}
else{var t243=t230;var t1540=t243.cdr;return t229(k1127,t1540);t1533=undefined;}};t236=t1531;var t1542=t230.car;return t236(k1126,t1542);t1528=undefined;}};t229=t1524;return t229(k1125,t225);t1521=undefined;}};___append=t1518;var t1545=function(k1129,t245){var r=SPOCK.count(arguments);if(r)return r;var t246=undefined;var t1546=function(k1130,t247,t248){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1547=(t247)instanceof SPOCK.Pair;var t981=t1547;var t1548;if(t981!==false){var t1551=t247.cdr;var t1549=t1551;var t1552=t247.car;var t251=t1552;var t1553=new SPOCK.Pair(t251,t248);var t1550=t1553;t247=t1549;t248=t1550;continue loop;t1548=undefined;}
else{return k1130(t248);t1548=undefined;}}};t246=t1546;var t1555=null;return t246(k1129,t245,t1555);};___reverse=t1545;var t1557=function(k1131,t254,t255){var r=SPOCK.count(arguments);if(r)return r;var t256=undefined;var t1558=function(k1132,t257,t258){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1560=(t257)<=0;var t1559;if(t1560!==false){return k1132(t258);t1559=undefined;}
else{var t1564=(t257)-1;var t1562=t1564;var t1565=t258.cdr;var t1563=t1565;t257=t1562;t258=t1563;continue loop;t1559=undefined;}}};t256=t1558;return t256(k1131,t255,t254);};___list_2dtail=t1557;var t260=___list_2dtail;var t1567=function(k1133,t261,t262){var r=SPOCK.count(arguments);if(r)return r;var t1568=function(t1134){var t263=t1134;var t1569=t263.car;return k1133(t1569);};return t260(t1568,t261,t262);};___list_2dref=t1567;var t1572=function(K){SPOCK.count(arguments,'memq');var x=arguments[1];for(var n=arguments[2];n instanceof SPOCK.Pair;n=n.cdr){if(n.car===x)return K(n);}
return K(false);};___memq=t1572;var t1573=function(K){SPOCK.count(arguments,'memv');var x=arguments[1];for(var n=arguments[2];n instanceof SPOCK.Pair;n=n.cdr){if(SPOCK.eqvp(n.car,x))return K(n);}
return K(false);};___memv=t1573;var t1574=function(K){SPOCK.count(arguments,'member');var x=arguments[1];for(var n=arguments[2];n instanceof SPOCK.Pair;n=n.cdr){if(SPOCK.equalp(n.car,x))return K(n);}
return K(false);};___member=t1574;var t1575=function(K){SPOCK.count(arguments,'assq');var x=arguments[1];for(var n=arguments[2];n instanceof SPOCK.Pair;n=n.cdr){var p=n.car;if(p instanceof SPOCK.Pair&&p.car===x)return K(p);}
return K(false);};___assq=t1575;var t1576=function(K){SPOCK.count(arguments,'assv');var x=arguments[1];for(var n=arguments[2];n instanceof SPOCK.Pair;n=n.cdr){var p=n.car;if(p instanceof SPOCK.Pair&&SPOCK.eqvp(p.car,x))return K(p);}
return K(false);};___assv=t1576;var t1577=function(K){SPOCK.count(arguments,'assoc');var x=arguments[1];for(var n=arguments[2];n instanceof SPOCK.Pair;n=n.cdr){var p=n.car;if(p instanceof SPOCK.Pair&&SPOCK.equalp(p.car,x))return K(p);}
return K(false);};___assoc=t1577;var t1578=function(K){SPOCK.count(arguments,'%+');var len=arguments.length;switch(len){case 1:return K(0);case 2:return K(arguments[1]);default:var p=arguments[1];for(var i=2;i<len;++i){p+=arguments[i];}
return K(p);}};____25_2b=t1578;var t1579=function(K){SPOCK.count(arguments,'%-');var len=arguments.length;switch(len){case 2:return K(-arguments[1]);default:var p=arguments[1];for(var i=2;i<len;++i){p-=arguments[i];}
return K(p);}};____25_2d=t1579;var t1580=function(K){SPOCK.count(arguments,'%*');var len=arguments.length;switch(len){case 1:return K(1);case 2:return K(arguments[1]);default:var p=arguments[1];for(var i=2;i<len;++i){p*=arguments[i];}
return K(p);}};____25_2a=t1580;var t1581=function(K){SPOCK.count(arguments,'%/');var len=arguments.length;switch(len){case 2:return K(1/arguments[1]);default:var p=arguments[1];for(var i=2;i<len;++i){p/=arguments[i];}
return K(p);}};____25_2f=t1581;var t1582=function(K){SPOCK.count(arguments,'%=');var argc=arguments.length;var last=SPOCK.check(arguments[1],'number','=');for(var i=2;i<argc;++i){var x=SPOCK.check(arguments[i],'number','=');if(last!==x)return K(false);else last=x;}
return K(true);};____25_3d=t1582;var t1583=function(K){SPOCK.count(arguments,'%>');var argc=arguments.length;var last=SPOCK.check(arguments[1],'number','>');for(var i=2;i<argc;++i){var x=SPOCK.check(arguments[i],'number','>');if(last<=x)return K(false);else last=x;}
return K(true);};____25_3e=t1583;var t1584=function(K){SPOCK.count(arguments,'%<');var argc=arguments.length;var last=SPOCK.check(arguments[1],'number','<');for(var i=2;i<argc;++i){var x=SPOCK.check(arguments[i],'number','<');if(last>=x)return K(false);else last=x;}
return K(true);};____25_3c=t1584;var t1585=function(K){SPOCK.count(arguments,'%>=');var argc=arguments.length;var last=SPOCK.check(arguments[1],'number','>=');for(var i=2;i<argc;++i){var x=SPOCK.check(arguments[i],'number','>=');if(last<x)return K(false);else last=x;}
return K(true);};____25_3e_3d=t1585;var t1586=function(K){SPOCK.count(arguments,'%<=');var argc=arguments.length;var last=SPOCK.check(arguments[1],'number','<=');for(var i=2;i<argc;++i){var x=SPOCK.check(arguments[i],'number','<=');if(last>x)return K(false);else last=x;}
return K(true);};____25_3c_3d=t1586;var t1587=function(K){SPOCK.count(arguments,'%max');return K(Math.max.apply(SPOCK.global,arguments));};____25max=t1587;var t1588=function(K){SPOCK.count(arguments,'%max');return K(Math.min.apply(SPOCK.global,arguments));};____25max=t1588;var t1589=function(k1135,t264,t265){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1590=(t264)/(t265);var t275=t1590;var t1592=(t275)<0;var t1591;if(t1592!==false){var t1593=Math.ceil(t275);t1591=t1593;}
else{var t1594=Math.floor(t275);t1591=t1594;}
var t271=t1591;var t1595=(t271)*(t265);var t270=t1595;var t1596=(t264)-(t270);var t266=t1596;var t1597=(t265)<(0);var t982=t1597;var t1598;if(t982!==false){var t1599=(t266)<=(0);var t983=t1599;var t1600;if(t983!==false){t1600=t266;}
else{var t1601=(t266)+(t265);t1600=t1601;}
t1598=t1600;}
else{var t1602=(t266)>=(0);var t984=t1602;var t1603;if(t984!==false){t1603=t266;}
else{var t1604=(t266)+(t265);t1603=t1604;}
t1598=t1603;}
return k1135(t1598);}};___modulo=t1589;var t1606=function(k1136,t289,t290){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1607=(t289)/(t290);var t297=t1607;var t1609=(t297)<0;var t1608;if(t1609!==false){var t1610=Math.ceil(t297);t1608=t1610;}
else{var t1611=Math.floor(t297);t1608=t1611;}
var t293=t1608;var t1612=(t293)*(t290);var t292=t1612;var t1613=(t289)-(t292);return k1136(t1613);}};var t288=t1606;var t1615=function(k1137,t300,t301){var r=SPOCK.count(arguments);if(r)return r;var t302=undefined;var t1616=function(k1138,t303,t304){var r=SPOCK.count(arguments);if(r)return r;var t1617=(0)===(t304);var t985=t1617;var t1618;if(t985!==false){var t1619=Math.abs(t303);return k1138(t1619);t1618=undefined;}
else{var t1621=function(t1139){return t302(k1138,t304,t1139);};return t288(t1621,t303,t304);t1618=undefined;}};t302=t1616;return t302(k1137,t300,t301);};____25gcd=t1615;var t1625=function(k1140,t309){var t309=SPOCK.rest(arguments,1);var t1627=null;var t1626=(t309)===(t1627);var t986=t1626;var t1628;if(t986!==false){return k1140(0);t1628=undefined;}
else{var t313=undefined;var t1630=function(k1141,t314,t315){var r=SPOCK.count(arguments);if(r)return r;var t1631=t314.car;var t316=t1631;var t1632=t314.cdr;var t317=t1632;var t1634=null;var t1633=(t317)===(t1634);var t987=t1633;var t1635;if(t987!==false){var t1636=Math.abs(t316);return k1141(t1636);t1635=undefined;}
else{var t1638=t317.car;var t324=t1638;var t1639=function(t1143){var t326=t1143;var t1640=t317.cdr;var t327=t1640;var t1641=new SPOCK.Pair(t326,t327);var t1142=t1641;return t313(k1141,t1142,false);};return ____25gcd(t1639,t316,t324);t1635=undefined;}};t313=t1630;return t313(k1140,t309,true);t1628=undefined;}};___gcd=t1625;var t1645=function(k1144,t329,t330){var r=SPOCK.count(arguments);if(r)return r;var t1646=(t329)*(t330);var t331=t1646;var t1647=function(t1145){var t332=t1145;var t1648=(t331)/(t332);var t335=t1648;var t1650=(t335)<0;var t1649;if(t1650!==false){var t1651=Math.ceil(t335);t1649=t1651;}
else{var t1652=Math.floor(t335);t1649=t1652;}
return k1144(t1649);};return ____25gcd(t1647,t329,t330);};____25lcm=t1645;var t1655=function(k1146,t338){var t338=SPOCK.rest(arguments,1);var t1657=null;var t1656=(t338)===(t1657);var t988=t1656;var t1658;if(t988!==false){return k1146(1);t1658=undefined;}
else{var t342=undefined;var t1660=function(k1147,t343,t344){var r=SPOCK.count(arguments);if(r)return r;var t1661=t343.car;var t345=t1661;var t1662=t343.cdr;var t346=t1662;var t1664=null;var t1663=(t346)===(t1664);var t989=t1663;var t1665;if(t989!==false){var t1666=Math.abs(t345);return k1147(t1666);t1665=undefined;}
else{var t1668=t346.car;var t353=t1668;var t1669=function(t1149){var t355=t1149;var t1670=t346.cdr;var t356=t1670;var t1671=new SPOCK.Pair(t355,t356);var t1148=t1671;return t342(k1147,t1148,false);};return ____25lcm(t1669,t345,t353);t1665=undefined;}};t342=t1660;return t342(k1146,t338,true);t1658=undefined;}};___lcm=t1655;var t1675=function(K){SPOCK.count(arguments,'string->symbol');var str=SPOCK.jstring(arguments[1]);return K(SPOCK.intern(str));};___string_2d_3esymbol=t1675;var t1676=function(k1150,t358,t359){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1678=t359.name;var t1677=(t358).plist[(t1678)];var t360=t1677;var t1679=t360===undefined;var t361=t1679;var t1680;if(t361!==false){t1680=false;}
else{t1680=true;}
var t990=t1680;var t1681;if(t990!==false){t1681=t360;}
else{t1681=false;}
return k1150(t1681);}};___get=t1676;var t1683=function(k1151,t363,t364,t365){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1685=t364.name;var t1684=(t363).plist[(t1685)]=(t365);return k1151(t1684);}};___put_21=t1683;var t1687=function(K){SPOCK.count(arguments,'string-append');var args=Array.prototype.slice.call(arguments,1);var strs=SPOCK.map(function(x){return SPOCK.jstring(x);},args);return K(new SPOCK.String(strs));};___string_2dappend=t1687;var t1688=function(K){SPOCK.count(arguments,'string');var str=[];var len=arguments.length-1;for(var i=1;i<=len;++i){var x=arguments[i];if(x instanceof SPOCK.Char)str.push(x.character);else SPOCK.error('bad argument type - not a character',x);}
return K(new SPOCK.String(str.join('')));};___string=t1688;var t1689=function(K){SPOCK.count(arguments,'string->list');var str=SPOCK.jstring(arguments[1]);var lst=null;var len=str.length;for(var i=len-1;i>=0;--i)
lst=new SPOCK.Pair(new SPOCK.Char(str.charAt(i)),lst);return K(lst);};___string_2d_3elist=t1689;var t1690=function(K){SPOCK.count(arguments,'list->string');var lst=arguments[1];var str=[];while(lst instanceof SPOCK.Pair){str.push(SPOCK.check(lst.car,SPOCK.Char).character);lst=lst.cdr;}
return K(new SPOCK.String(str.join('')));};___list_2d_3estring=t1690;var t1691=function(K){SPOCK.count(arguments,'make-string');var n=SPOCK.check(arguments[1],'number','make-string');var c=arguments[2];var a=new Array(n);if(c!==undefined)
c=SPOCK.check(c,SPOCK.Char,'make-string').character;else c=' ';for(var i=0;i<n;++i)a[i]=c;return K(new SPOCK.String(a.join('')));};___make_2dstring=t1691;var t1692=function(K){SPOCK.count(arguments,'string-ref');var str=arguments[1];var i=SPOCK.check(arguments[2],'number','string-ref');if(typeof str==='string')
return K(new SPOCK.Char(str.charAt(i)));else if(str instanceof SPOCK.String){var parts=str.parts;for(var p in parts){var l=parts[p].length;if(i<=l)return K(new SPOCK.Char(parts[p].charAt(i)));else i-=l;}
SPOCK.error('`string-ref\' out of range',str,i);}};___string_2dref=t1692;var t1693=function(K){SPOCK.count(arguments,'string-set!');var str=arguments[1];var i=SPOCK.check(arguments[2],'number','string-set!');var c=SPOCK.check(arguments[3],SPOCK.Char,'string-set!');if(typeof str==='string')
SPOCK.error('argument to `string-set!\' is not a mutable string',str);else if(str instanceof SPOCK.String){var parts=str.parts;for(var p in parts){var part=parts[p];var l=part.length;if(i<=l){parts[p]=part.substring(0,i)+c.character+part.substring(i+1);return K(undefined);}else i-=l;}
SPOCK.error('`string-set!\' out of range',str,i);}};___string_2dset_21=t1693;var t1694=function(k1152,t366,t367,t368){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1695=SPOCK.jstring(t366);var t369=t1695;var t1696=t367===undefined;var t991=t1696;var t1697;if(t991!==false){t1697=0;}
else{t1697=t367;}
var t371=t1697;var t1698=t368===undefined;var t992=t1698;var t1699;if(t992!==false){var t1700=t369.length;t1699=t1700;}
else{t1699=t368;}
var t373=t1699;var t1701=t369.slice(t371,t373);var t375=t1701;var t1702=new SPOCK.String(t375);return k1152(t1702);}};___string_2dcopy=t1694;var t1704=function(k1153,t376,t377,t378,t379){var r=SPOCK.count(arguments);if(r)return r;var t1705;if(true!==false){t1705=false;}
else{t1705=true;}
var t993=t1705;var t1706=function(t1154){var t1707=t376.normalize();var t381=t1707;var t382=t377;var t1708=t378===undefined;var t994=t1708;var t1709;if(t994!==false){t1709=0;}
else{t1709=t378;}
var t383=t1709;var t1710=t379===undefined;var t995=t1710;var t1711;if(t995!==false){var t1712=t381.length;t1711=t1712;}
else{t1711=t379;}
var t385=t1711;var t1713=function(K){SPOCK.count(arguments);var str=arguments[1];var from=arguments[2];var to=arguments[3];var c=arguments[4];var snew=new Array(to-from);for(var i in snew)snew[i]=c;str.parts=[str.parts[0].substring(0,from),snew.join(''),str.parts[0].substring(to)];return K(str);};return t1713(k1153,t376,t383,t385,t382);};var t1155=t1706;var t1715;if(t993!==false){return ____25error(t1155,"bad argument type - not a mutable string",t376);t1715=undefined;}
else{return t1155(undefined);t1715=undefined;}};___string_2dfill_21=t1704;var t1718=function(K){SPOCK.count(arguments,'vector');return K(Array.prototype.slice.call(arguments,1));};___vector=t1718;var t1719=function(K){SPOCK.count(arguments,'make-vector');var n=SPOCK.check(arguments[1],'number','make-vector');var x=arguments[2];var a=new Array(n);if(x!==undefined){for(var i=0;i<n;++i)a[i]=x;}
return K(a);};___make_2dvector=t1719;var t1720=function(K){SPOCK.count(arguments,'vector->list');var vec=SPOCK.check(arguments[1],Array,'vector->list');var lst=null;var len=vec.length;for(var i=len-1;i>=0;--i)
lst=new SPOCK.Pair(vec[i],lst);return K(lst);};___vector_2d_3elist=t1720;var t1721=function(K){SPOCK.count(arguments,'list->vector');var lst=arguments[1];var vec=[];while(lst instanceof SPOCK.Pair){vec.push(lst.car);lst=lst.cdr;}
return K(vec);};___list_2d_3evector=t1721;var t1722=function(K){SPOCK.count(arguments,'vector-fill!');var vec=SPOCK.check(arguments[1],Array,'vector-fill!');var x=arguments[2];var from=arguments[3];var to=arguments[4];if(from===undefined)from=0;if(to===undefined)to=vec.length;for(var i=from;i<to;++i)
vec[i]=x;return K(undefined);};___vector_2dfill_21=t1722;var t1723=function(K){SPOCK.count(arguments,'string->number');var str=SPOCK.jstring(arguments[1]);var base=arguments[2];if(!base)base=10;else base=SPOCK.check(base,'number','string->number');var m=true,neg=1;while(m){m=str.match(/^#[eboxid]/);if(m){switch(str[1]){case'e':case'i':break;case'd':base=10;break;case'o':base=8;break;case'x':base=16;break;case'b':base=2;break;default:return K(false);}
str=str.substring(2);}}
switch(str[0]){case'-':neg=-1;str=str.substring(1);break;case'+':str=str.substring(1);}
var num,den=false;if((m=str.match(/^([^\/]+)\/(.+)$/))){str=m[1];den=m[2];}
function num3(s){var tr=null;switch(base){case 2:tr=/^[0-1]+$/;break;case 8:tr=/^[0-7]+$/;break;case 10:tr=/^[#0-9]*\.?[#0-9]+([esdfl][-+]?[0-9]+)?$/;break;case 16:tr=/^[0-9a-fA-F]+$/;}
if(tr&&!s.match(tr))return false;var s2=s.replace(/#/g,'0');if(base===10)s2=parseFloat(s2.replace(/[esdfl]/g,'e'));else if(s2!==s)return false;else s2=parseInt(s2,base);return isNaN(s2)?false:s2;}
if((num=num3(str))===false)return K(false);if(den&&!(den=num3(den)))return K(false);return K(neg*num/(den||1));};___string_2d_3enumber=t1723;var t1724=function(K){SPOCK.count(arguments,'%show');arguments[2].write(arguments[1]);return K(undefined);};____25show=t1724;var t1725=function(K){SPOCK.count(arguments,'%fetch');return K(arguments[2].read(arguments[1]));};____25fetch=t1725;var t1726=function(k1156,t387){var r=SPOCK.count(arguments);if(r)return r;var t1727=t387===undefined;var t996=t1727;var t1728;if(t996!==false){t1728=SPOCK.stdout;}
else{t1728=t387;}
return ____25show(k1156,"\n",t1728);};___newline=t1726;var t1730=function(k1157,t392){var r=SPOCK.count(arguments);if(r)return r;var t1731=function(t1158){var t393=t1158;var t400=SPOCK.EOF;var t1732=(t393)===(t400);var t998=t1732;var t1733;if(t998!==false){t1733=t393;}
else{var t1734=new SPOCK.Char(t393);t1733=t1734;}
return k1157(t1733);};var t1736=t392===undefined;var t997=t1736;var t1737;if(t997!==false){t1737=SPOCK.stdin;}
else{t1737=t392;}
return ____25fetch(t1731,1,t1737);};___read_2dchar=t1730;var t1739=function(k1159,t401,t402){var r=SPOCK.count(arguments);if(r)return r;var t1740=t401.character;var t1741=t402===undefined;var t999=t1741;var t1742;if(t999!==false){t1742=SPOCK.stdout;}
else{t1742=t402;}
return ____25show(k1159,t1740,t1742);};___write_2dchar=t1739;var t407=___read_2dchar;var t1744=function(k1160,t408){var r=SPOCK.count(arguments);if(r)return r;var t1745=function(t1161){var t409=t1161;var t413=SPOCK.EOF;var t1746=(t409)===(t413);var t410=t1746;var t1747;if(t410!==false){t1747=false;}
else{t1747=true;}
var t1000=t1747;var t1748;if(t1000!==false){var t1750=t409.character;var t1749=(t408).peeked=(t1750);t1748=t1749;}
else{t1748=undefined;}
return k1160(t409);};return t407(t1745,t408);};___peek_2dchar=t1744;var t1753=function(k1162,t414){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t1754=t414.ready();return k1162(t1754);}};___char_2dready_3f=t1753;var t1756=function(k1163,t418,t419,t420){var r=SPOCK.count(arguments);if(r)return r;return ____25show(k1163,"#<unknown object>",t419);};____25print_2dhook=t1756;var t1758=function(k1164,t421,t422){var r=SPOCK.count(arguments);if(r)return r;var t1759=t422===undefined;var t1001=t1759;var t1760;if(t1001!==false){t1760=SPOCK.stdout;}
else{t1760=t422;}
var t423=t1760;var t428=undefined;var t1761=function(k1165,t429){var r=SPOCK.count(arguments);if(r)return r;var t1763=null;var t1762=(t429)===(t1763);var t1002=t1762;var t1764;if(t1002!==false){return ____25show(k1165,"()",t423);t1764=undefined;}
else{var t1766=typeof(t429);var t434=t1766;var t1767=(t434)===("number");var t1003=t1767;var t1768;if(t1003!==false){var t1771=undefined===undefined;var t1004=t1771;var t1772;if(t1004!==false){t1772=10;}
else{t1772=undefined;}
var t1770=t429.toString(t1772);var t1769=new SPOCK.String(t1770);var t436=t1769;var t1773=SPOCK.jstring(t436);return ____25show(k1165,t1773,t423);t1768=undefined;}
else{var t1775=typeof(t429);var t442=t1775;var t1776=(t442)===("string");var t441=t1776;var t1777;if(t441!==false){t1777=t441;}
else{var t1778=(t429)instanceof SPOCK.String;t1777=t1778;}
var t1005=t1777;var t1779;if(t1005!==false){var t1780=SPOCK.jstring(t429);return ____25show(k1165,t1780,t423);t1779=undefined;}
else{var t1782=(t429)instanceof SPOCK.Symbol;var t1006=t1782;var t1783;if(t1006!==false){var t1784=t429.name;return ____25show(k1165,t1784,t423);t1783=undefined;}
else{var t1786=(t429)instanceof SPOCK.Char;var t1007=t1786;var t1787;if(t1007!==false){var t1788=t429.character;return ____25show(k1165,t1788,t423);t1787=undefined;}
else{var t448=SPOCK.EOF;var t1790=(t429)===(t448);var t1008=t1790;var t1791;if(t1008!==false){return ____25show(k1165,"#<eof>",t423);t1791=undefined;}
else{var t1793=typeof(t429);var t450=t1793;var t1794=(t450)===("function");var t1009=t1794;var t1795;if(t1009!==false){return ____25show(k1165,"#<procedure>",t423);t1795=undefined;}
else{var t1797=(t429)===(true);var t453=t1797;var t1798;if(t453!==false){t1798=t453;}
else{var t1799=(t429)===(false);t1798=t1799;}
var t1010=t1798;var t1800;if(t1010!==false){var t1801;if(t429!==false){t1801="#t";}
else{t1801="#f";}
return ____25show(k1165,t1801,t423);t1800=undefined;}
else{var t1803=(t429)instanceof SPOCK.Pair;var t1011=t1803;var t1804;if(t1011!==false){var t1805=function(t1166){var t459=undefined;var t1806=function(k1167,t460){var r=SPOCK.count(arguments);if(r)return r;var t1808=null;var t1807=(t460)===(t1808);var t1012=t1807;var t1809;if(t1012!==false){return ____25show(k1167,")",t423);t1809=undefined;}
else{var t1811=(t460)instanceof SPOCK.Pair;var t464=t1811;var t1812;if(t464!==false){t1812=false;}
else{t1812=true;}
var t1013=t1812;var t1813;if(t1013!==false){var t1814=function(t1168){var t1815=function(t1169){return ____25show(k1167,")",t423);};return t428(t1815,t460);};return ____25show(t1814," . ",t423);t1813=undefined;}
else{var t467=t429;var t1819=(t467)===(t460);var t466=t1819;var t1820;if(t466!==false){t1820=false;}
else{t1820=true;}
var t1014=t1820;var t1821=function(t1170){var t1822=function(t1171){var t1823=t460.cdr;return t459(k1167,t1823);};var t1825=t460.car;return t428(t1822,t1825);};var t1172=t1821;var t1827;if(t1014!==false){return ____25show(t1172," ",t423);t1827=undefined;}
else{return t1172(undefined);t1827=undefined;}
t1813=t1827;}
t1809=t1813;}};t459=t1806;return t459(k1165,t429);};return ____25show(t1805,"(",t423);t1804=undefined;}
else{var t1832=t429===undefined;var t1015=t1832;var t1833;if(t1015!==false){return ____25show(k1165,"#<undefined>",t423);t1833=undefined;}
else{var t1835=(t429)instanceof Array;var t1016=t1835;var t1836;if(t1016!==false){var t1837=t429.length;var t474=t1837;var t1838=function(t1173){var t475=undefined;var t1839=function(k1174,t476){var r=SPOCK.count(arguments);if(r)return r;var t1841=(t476)>=(t474);var t1840;if(t1841!==false){return ____25show(k1174,")",t423);t1840=undefined;}
else{var t1843=(t476)===(0);var t477=t1843;var t1844;if(t477!==false){t1844=false;}
else{t1844=true;}
var t1017=t1844;var t1845=function(t1175){var t1846=function(t1176){var t1847=1+(t476);return t475(k1174,t1847);};var t1849=(t429)[(t476)];return t428(t1846,t1849);};var t1177=t1845;var t1851;if(t1017!==false){return ____25show(t1177," ",t423);t1851=undefined;}
else{return t1177(undefined);t1851=undefined;}
t1840=t1851;}};t475=t1839;return t475(k1165,0);};return ____25show(t1838,"#(",t423);t1836=undefined;}
else{var t1857=(t429)instanceof SPOCK.Port;var t1856;if(t1857!==false){var t1858=SPOCK.stringify(t429);return ____25show(k1165,t1858,t423);t1856=undefined;}
else{var t1861=(t429)instanceof SPOCK.Promise;var t1860;if(t1861!==false){return ____25show(k1165,"#<promise>",t423);t1860=undefined;}
else{var t1863=typeof(t429);var t481=t1863;var t1864=("object")===(t481);var t1018=t1864;var t1865;if(t1018!==false){return ____25print_2dhook(k1165,t429,t423,false);t1865=undefined;}
else{return ____25show(k1165,"#<unknown object>",t423);t1865=undefined;}
t1860=t1865;}
t1856=t1860;}
t1836=t1856;}
t1833=t1836;}
t1804=t1833;}
t1800=t1804;}
t1795=t1800;}
t1791=t1795;}
t1787=t1791;}
t1783=t1787;}
t1779=t1783;}
t1768=t1779;}
t1764=t1768;}};t428=t1761;return t428(k1164,t421);};___display=t1758;var t482=___display;var t483=undefined;var t1869=function(K){SPOCK.count(arguments,'t483');var str=arguments[1];var a=[];var len=str.length;for(var i=0;i<len;++i){var c=str.charAt(i);switch(c){case'\n':a.push('\n');break;case'\t':a.push('\t');break;case'\r':a.push('\r');break;case'\"':a.push('\"');break;case'\\':a.push('\\');break;default:a.push(c);}}
return K(a.join(''));};t483=t1869;var t1870=function(k1178,t484,t485){var r=SPOCK.count(arguments);if(r)return r;var t1871=t485===undefined;var t1019=t1871;var t1872;if(t1019!==false){t1872=SPOCK.stdout;}
else{t1872=t485;}
var t486=t1872;var t491=undefined;var t1873=function(k1179,t492){var r=SPOCK.count(arguments);if(r)return r;var t1874=typeof(t492);var t495=t1874;var t1875=(t495)===("string");var t494=t1875;var t1876;if(t494!==false){t1876=t494;}
else{var t1877=(t492)instanceof SPOCK.String;t1876=t1877;}
var t1020=t1876;var t1878;if(t1020!==false){var t1879=function(t1180){var t1880=function(t1182){var t1881=function(t1181){return ____25show(k1179,"\"",t486);};return ____25show(t1881,t1182,t486);};var t1884=SPOCK.jstring(t492);return t483(t1880,t1884);};return ____25show(t1879,"\"",t486);t1878=undefined;}
else{var t1887=(t492)instanceof SPOCK.Char;var t1021=t1887;var t1888;if(t1021!==false){var t1889=function(t1183){var t1890=t492.character;var t498=t1890;var t1892=SPOCK.eqvp(t498,"\n");var t1022=t1892;var t1893;if(t1022!==false){t1893=true;}
else{t1893=false;}
var t1891;if(t1893!==false){t1891="newline";}
else{var t1895=SPOCK.eqvp(t498,"\r");var t1023=t1895;var t1896;if(t1023!==false){t1896=true;}
else{t1896=false;}
var t1894;if(t1896!==false){t1894="return";}
else{var t1898=SPOCK.eqvp(t498,"\t");var t1024=t1898;var t1899;if(t1024!==false){t1899=true;}
else{t1899=false;}
var t1897;if(t1899!==false){t1897="tab";}
else{var t1901=SPOCK.eqvp(t498," ");var t1025=t1901;var t1902;if(t1025!==false){t1902=true;}
else{t1902=false;}
var t1900;if(t1902!==false){t1900="space";}
else{t1900=t498;}
t1897=t1900;}
t1894=t1897;}
t1891=t1894;}
return ____25show(k1179,t1891,t486);};return ____25show(t1889,"#\\",t486);t1888=undefined;}
else{var t1905=(t492)instanceof SPOCK.Pair;var t1026=t1905;var t1906;if(t1026!==false){var t1907=function(t1184){var t509=undefined;var t1908=function(k1185,t510){var r=SPOCK.count(arguments);if(r)return r;var t1910=null;var t1909=(t510)===(t1910);var t1027=t1909;var t1911;if(t1027!==false){return ____25show(k1185,")",t486);t1911=undefined;}
else{var t1913=(t510)instanceof SPOCK.Pair;var t514=t1913;var t1914;if(t514!==false){t1914=false;}
else{t1914=true;}
var t1028=t1914;var t1915;if(t1028!==false){var t1916=function(t1186){var t1917=function(t1187){return ____25show(k1185,")",t486);};return t491(t1917,t510);};return ____25show(t1916," . ",t486);t1915=undefined;}
else{var t517=t492;var t1921=(t517)===(t510);var t516=t1921;var t1922;if(t516!==false){t1922=false;}
else{t1922=true;}
var t1029=t1922;var t1923=function(t1188){var t1924=function(t1189){var t1925=t510.cdr;return t509(k1185,t1925);};var t1927=t510.car;return t491(t1924,t1927);};var t1190=t1923;var t1929;if(t1029!==false){return ____25show(t1190," ",t486);t1929=undefined;}
else{return t1190(undefined);t1929=undefined;}
t1915=t1929;}
t1911=t1915;}};t509=t1908;return t509(k1179,t492);};return ____25show(t1907,"(",t486);t1906=undefined;}
else{var t1934=(t492)instanceof Array;var t1030=t1934;var t1935;if(t1030!==false){var t1936=t492.length;var t523=t1936;var t1937=function(t1191){var t524=undefined;var t1938=function(k1192,t525){var r=SPOCK.count(arguments);if(r)return r;var t1940=(t525)>=(t523);var t1939;if(t1940!==false){return ____25show(k1192,")",t486);t1939=undefined;}
else{var t1942=(t525)===(0);var t526=t1942;var t1943;if(t526!==false){t1943=false;}
else{t1943=true;}
var t1031=t1943;var t1944=function(t1193){var t1945=function(t1194){var t1946=1+(t525);return t524(k1192,t1946);};var t1948=(t492)[(t525)];return t491(t1945,t1948);};var t1195=t1944;var t1950;if(t1031!==false){return ____25show(t1195," ",t486);t1950=undefined;}
else{return t1195(undefined);t1950=undefined;}
t1939=t1950;}};t524=t1938;return t524(k1179,0);};return ____25show(t1937,"#(",t486);t1935=undefined;}
else{return t482(k1179,t492,t486);t1935=undefined;}
t1906=t1935;}
t1888=t1906;}
t1878=t1888;}};t491=t1873;return t491(k1178,t484);};___write=t1870;var t1957=function(K){SPOCK.count(arguments,'apply');var proc=arguments[1];var argc=arguments.length;var lst=arguments[argc-1];var vec=[K].concat(Array.prototype.slice.call(arguments,2,argc-1));if(lst instanceof Array)vec=vec.concat(lst);else{var len=SPOCK.length(lst);var vec2=new Array(len);for(var i=0;lst instanceof SPOCK.Pair;lst=lst.cdr)
vec2[i++]=lst.car;vec=vec.concat(vec2);}
return proc.apply(SPOCK.global,vec);};___apply=t1957;var t1958=function(k1196,t529,t530,t531){var r=SPOCK.count(arguments);if(r)return r;var t531=SPOCK.rest(arguments,3);var t1960=null;var t1959=(t531)===(t1960);var t1032=t1959;var t1961;if(t1032!==false){var t1962=(t530)instanceof Array;var t1033=t1962;var t1963;if(t1033!==false){var t1964=t530.length;var t536=t1964;var t538=undefined;var t1965=function(k1197,t539){var r=SPOCK.count(arguments);if(r)return r;var t541=t536;var t1966=(t539)>=(t541);var t1034=t1966;var t1967;if(t1034!==false){return k1197(false);t1967=undefined;}
else{var t1969=function(t1198){var t1970=(t539)+(1);return t538(k1197,t1970);};var t542=t530;var t1972=(t542)[(t539)];return t529(t1969,t1972);t1967=undefined;}};t538=t1965;return t538(k1196,0);t1963=undefined;}
else{var t546=undefined;var t1975=function(k1199,t547){var r=SPOCK.count(arguments);if(r)return r;var t1976=(t547)instanceof SPOCK.Pair;var t1035=t1976;var t1977;if(t1035!==false){var t1978=function(t1200){var t1979=t547.cdr;return t546(k1199,t1979);};var t1981=t547.car;return t529(t1978,t1981);t1977=undefined;}
else{return k1199(undefined);t1977=undefined;}};t546=t1975;return t546(k1196,t530);t1963=undefined;}
t1961=t1963;}
else{var t551=undefined;var t1985=function(k1201,t552){var r=SPOCK.count(arguments);if(r)return r;var t554=undefined;var t1986=function(k1207,t555){var r=SPOCK.count(arguments);if(r)return r;var t1988=null;var t1987=(t555)===(t1988);var t1036=t1987;var t1989;if(t1036!==false){var t1990=null;return k1207(t1990);t1989=undefined;}
else{var t1992=t555.car;var t559=t1992;var t1993=(t559)instanceof SPOCK.Pair;var t1037=t1993;var t1994;if(t1037!==false){var t1995=t559.car;var t562=t1995;var t1996=function(t1208){var t563=t1208;var t1997=new SPOCK.Pair(t562,t563);return k1207(t1997);};var t1999=t555.cdr;return t554(t1996,t1999);t1994=undefined;}
else{return k1207(false);t1994=undefined;}
t1989=t1994;}};t554=t1986;var t2002=function(t1202){var t553=t1202;var t2003;if(t553!==false){var t2004=function(t1203){var t566=undefined;var t2005=function(k1205,t567){var r=SPOCK.count(arguments);if(r)return r;var t2007=null;var t2006=(t567)===(t2007);var t1038=t2006;var t2008;if(t1038!==false){var t2009=null;return k1205(t2009);t2008=undefined;}
else{var t2011=t567.car;var t573=t2011;var t2012=t573.cdr;var t571=t2012;var t2013=function(t1206){var t572=t1206;var t2014=new SPOCK.Pair(t571,t572);return k1205(t2014);};var t2016=t567.cdr;return t566(t2013,t2016);t2008=undefined;}};t566=t2005;var t2018=function(t1204){return t551(k1201,t1204);};return t566(t2018,t552);};return ___apply(t2004,t529,t553);t2003=undefined;}
else{return k1201(undefined);t2003=undefined;}};return t554(t2002,t552);};t551=t1985;var t2024=new SPOCK.Pair(t530,t531);return t551(k1196,t2024);t1961=undefined;}};___for_2deach=t1958;var t2026=function(k1209,t578,t579,t580){var r=SPOCK.count(arguments);if(r)return r;var t580=SPOCK.rest(arguments,3);var t2028=null;var t2027=(t580)===(t2028);var t1039=t2027;var t2029;if(t1039!==false){var t2030=(t579)instanceof Array;var t1040=t2030;var t2031;if(t1040!==false){var t2032=t579.length;var t585=t2032;var t2033=function(t1210){var t587=t1210;var t588=undefined;var t2034=function(k1211,t589){var r=SPOCK.count(arguments);if(r)return r;var t591=t585;var t2035=(t589)>=(t591);var t1041=t2035;var t2036;if(t1041!==false){return k1211(t587);t2036=undefined;}
else{var t592=t587;var t593=t589;var t2038=function(t1213){var t594=t1213;var t2039=(t592)[(t593)]=(t594);var t1212=t2039;var t2040=(t589)+(1);return t588(k1211,t2040);};var t595=t579;var t2042=(t595)[(t589)];return t578(t2038,t2042);t2036=undefined;}};t588=t2034;return t588(k1209,0);};return ___make_2dvector(t2033,t585);t2031=undefined;}
else{var t599=undefined;var t2046=function(k1214,t600){var r=SPOCK.count(arguments);if(r)return r;var t2047=(t600)instanceof SPOCK.Pair;var t1042=t2047;var t2048;if(t1042!==false){var t2049=function(t1215){var t602=t1215;var t2050=function(t1216){var t603=t1216;var t2051=new SPOCK.Pair(t602,t603);return k1214(t2051);};var t2053=t600.cdr;return t599(t2050,t2053);};var t2055=t600.car;return t578(t2049,t2055);t2048=undefined;}
else{var t2057=null;return k1214(t2057);t2048=undefined;}};t599=t2046;return t599(k1209,t579);t2031=undefined;}
t2029=t2031;}
else{var t606=undefined;var t2060=function(k1217,t607){var r=SPOCK.count(arguments);if(r)return r;var t609=undefined;var t2061=function(k1224,t610){var r=SPOCK.count(arguments);if(r)return r;var t2063=null;var t2062=(t610)===(t2063);var t1043=t2062;var t2064;if(t1043!==false){var t2065=null;return k1224(t2065);t2064=undefined;}
else{var t2067=t610.car;var t614=t2067;var t2068=(t614)instanceof SPOCK.Pair;var t1044=t2068;var t2069;if(t1044!==false){var t2070=t614.car;var t617=t2070;var t2071=function(t1225){var t618=t1225;var t2072=new SPOCK.Pair(t617,t618);return k1224(t2072);};var t2074=t610.cdr;return t609(t2071,t2074);t2069=undefined;}
else{return k1224(false);t2069=undefined;}
t2064=t2069;}};t609=t2061;var t2077=function(t1218){var t608=t1218;var t2078;if(t608!==false){var t2079=function(t1219){var t621=t1219;var t623=undefined;var t2080=function(k1222,t624){var r=SPOCK.count(arguments);if(r)return r;var t2082=null;var t2081=(t624)===(t2082);var t1045=t2081;var t2083;if(t1045!==false){var t2084=null;return k1222(t2084);t2083=undefined;}
else{var t2086=t624.car;var t630=t2086;var t2087=t630.cdr;var t628=t2087;var t2088=function(t1223){var t629=t1223;var t2089=new SPOCK.Pair(t628,t629);return k1222(t2089);};var t2091=t624.cdr;return t623(t2088,t2091);t2083=undefined;}};t623=t2080;var t2093=function(t1221){var t2094=function(t1220){var t622=t1220;var t2095=new SPOCK.Pair(t621,t622);return k1217(t2095);};return t606(t2094,t1221);};return t623(t2093,t607);};return ___apply(t2079,t578,t608);t2078=undefined;}
else{var t2100=null;return k1217(t2100);t2078=undefined;}};return t609(t2077,t607);};t606=t2060;var t2103=new SPOCK.Pair(t579,t580);return t606(k1209,t2103);t2029=undefined;}};___map=t2026;var t2105=function(k1226,t637,t638,t639){var r=SPOCK.count(arguments);if(r)return r;var t2106=function(t1227){var t2107=new SPOCK.Pair(t637,t639);var t640=t2107;var t641=SPOCK.dynwinds;var t2108=new SPOCK.Pair(t640,t641);SPOCK.dynwinds=t2108
var t2109=function(k1228){var t644=SPOCK.dynwinds;var t2110=t644.cdr;SPOCK.dynwinds=t2110
return t639(k1228);};return ____25call_2dwith_2dsaved_2dvalues(k1226,t638,t2109);};return t637(t2106);};___dynamic_2dwind=t2105;var t2114=function(K){SPOCK.count(arguments,'%call-with-current-continuation');var proc=arguments[1];function cont(){return K.apply(SPOCK.global,Array.prototype.slice.call(arguments,1));}
return proc(K,cont);};____25call_2dwith_2dcurrent_2dcontinuation=t2114;var t645=undefined;var t2115=function(k1229,t646,t647){var r=SPOCK.count(arguments);if(r)return r;var t649=SPOCK.dynwinds;var t2116=(t649)===(t646);var t648=t2116;var t2117;if(t648!==false){return k1229(t648);t2117=undefined;}
else{var t2119=(t647)<(0);var t1046=t2119;var t2120;if(t1046!==false){var t2121=function(t1230){var t2122=t646.car;var t654=t2122;var t2123=t654.car;var t2124=function(t1231){SPOCK.dynwinds=t646
return k1229(undefined);};return t2123(t2124);};var t2127=t646.cdr;var t2128=(t647)+1;return t645(t2121,t2127,t2128);t2120=undefined;}
else{var t658=SPOCK.dynwinds;var t2130=t658.car;var t657=t2130;var t2131=t657.cdr;var t656=t2131;var t659=SPOCK.dynwinds;var t2132=t659.cdr;SPOCK.dynwinds=t2132
var t2133=function(t1232){var t2134=(t647)-1;return t645(k1229,t646,t2134);};return t656(t2133);t2120=undefined;}
t2117=t2120;}};t645=t2115;var t2137=function(k1233,t660){var r=SPOCK.count(arguments);if(r)return r;var t661=SPOCK.dynwinds;var t2138=function(k1234,t662){var r=SPOCK.count(arguments);if(r)return r;var t2139=function(k1235,t663){var t663=SPOCK.rest(arguments,1);var t664=SPOCK.dynwinds;var t667=t661;var t2140=(t664)===(t667);var t665=t2140;var t2141;if(t665!==false){t2141=false;}
else{t2141=true;}
var t1047=t2141;var t2142=function(t1236){return ___apply(k1235,t662,t663);};var t1237=t2142;var t2144;if(t1047!==false){var t2145=SPOCK.length(t664);var t668=t2145;var t671=t661;var t2146=SPOCK.length(t671);var t669=t2146;var t2147=(t668)-(t669);return t645(t1237,t661,t2147);t2144=undefined;}
else{return t1237(undefined);t2144=undefined;}};return t660(k1234,t2139);};return ____25call_2dwith_2dcurrent_2dcontinuation(k1233,t2138);};___call_2dwith_2dcurrent_2dcontinuation=t2137;var t2152=function(k1238,t672){var r=SPOCK.count(arguments);if(r)return r;return ___vector(k1238,t672,SPOCK.dynwinds,SPOCK.stdin,SPOCK.stdout,SPOCK.stderr);};____25get_2dcontext=t2152;var t2154=function(K){SPOCK.count(arguments,'%restore-context');var state=arguments[1];SPOCK.dynwinds=state[1];SPOCK.stdin=state[2];SPOCK.stdout=state[3];SPOCK.stderr=state[4];return(state[0])(undefined);};____25restore_2dcontext=t2154;var t2155=function(k1239,t673){var r=SPOCK.count(arguments);if(r)return r;var t2156=function(k1240,t674){var r=SPOCK.count(arguments);if(r)return r;var t2157=function(t1242){var t2158=function(t1241){var t2159=function(K){SPOCK.count(arguments);return new SPOCK.Result(undefined);};return t2159(k1240);};return t673(t2158,t1242);};return ____25get_2dcontext(t2157,t674);};return ____25call_2dwith_2dcurrent_2dcontinuation(k1239,t2156);};___suspend=t2155;var t2164=function(k1243,t675){var r=SPOCK.count(arguments);if(r)return r;var t676=false;var t677=false;var t2166=function(k1244){var t2167;if(t676!==false){return ___apply(k1244,___values,t677);t2167=undefined;}
else{var t2169=function(k1245,t678){var t678=SPOCK.rest(arguments,1);var t2170;if(t676!==false){return ___apply(k1245,___values,t677);t2170=undefined;}
else{t676=true;t677=t678;return ___apply(k1245,___values,t677);t2170=undefined;}};return ___call_2dwith_2dvalues(k1244,t675,t2169);t2167=undefined;}};var t2165=new SPOCK.Promise(t2166);return k1243(t2165);};____25make_2dpromise=t2164;var t2175=function(k1246,t679){var r=SPOCK.count(arguments);if(r)return r;var t2177=(t679)instanceof SPOCK.Promise;var t2176;if(t2177!==false){var t2178=t679.thunk;return t2178(k1246);t2176=undefined;}
else{return k1246(t679);t2176=undefined;}};___force=t2175;var t680=___dynamic_2dwind;var t2181=function(k1247,t681,t682){var r=SPOCK.count(arguments);if(r)return r;var t686=false;var t2182=function(k1248){loop:while(true){t686=SPOCK.stdin;SPOCK.stdin=t681
return k1248(undefined);}};var t2184=function(k1249){loop:while(true){SPOCK.stdin=t686
return k1249(undefined);}};return t680(k1247,t2182,t682,t2184);};___with_2dinput_2dfrom_2dport=t2181;var t687=___dynamic_2dwind;var t2187=function(k1250,t688,t689){var r=SPOCK.count(arguments);if(r)return r;var t693=false;var t2188=function(k1251){loop:while(true){t693=SPOCK.stdout;SPOCK.stdout=t688
return k1251(undefined);}};var t2190=function(k1252){loop:while(true){SPOCK.stdout=t693
return k1252(undefined);}};return t687(k1250,t2188,t689,t2190);};___with_2doutput_2dto_2dport=t2187;var t2193=function(K){SPOCK.count(arguments,'%close-port');var port=arguments[1];port.close();port.closed=true;return K(port);};____25close_2dport=t2193;var t2194=function(K){SPOCK.count(arguments,'open-input-file');var fn=SPOCK.check(arguments[1],'string','open-input-file');return K(SPOCK.openInputFile(fn));};___open_2dinput_2dfile=t2194;var t2195=function(K){SPOCK.count(arguments,'open-output-file');var fn=SPOCK.check(arguments[1],'string','open-input-file');var exp=null;if(arguments.length===3)
exp=SPOCK.check(arguments[2],'number','open-input-file');return K(SPOCK.openOutputFile(fn,exp));};___open_2doutput_2dfile=t2195;var t2196=function(k1253,t694){var r=SPOCK.count(arguments);if(r)return r;var t695=t694;return ____25close_2dport(k1253,t695);};___close_2dinput_2dport=t2196;var t2198=function(k1254,t699){var r=SPOCK.count(arguments);if(r)return r;var t700=t699;return ____25close_2dport(k1254,t700);};___close_2doutput_2dport=t2198;var t705=___open_2dinput_2dfile;var t2200=function(k1255,t708,t709){var r=SPOCK.count(arguments);if(r)return r;var t2201=function(t1256){var t710=t1256;var t2202=function(k1257){return t709(k1257,t710);};var t2204=function(k1258){return ___close_2dinput_2dport(k1258,t710);};return ____25call_2dwith_2dsaved_2dvalues(k1255,t2202,t2204);};return t705(t2201,t708);};___call_2dwith_2dinput_2dfile=t2200;var t712=___open_2doutput_2dfile;var t2208=function(k1259,t715,t716){var r=SPOCK.count(arguments);if(r)return r;var t2209=function(t1260){var t717=t1260;var t2210=function(k1261){return t716(k1261,t717);};var t2212=function(k1262){return ___close_2doutput_2dport(k1262,t717);};return ____25call_2dwith_2dsaved_2dvalues(k1259,t2210,t2212);};return t712(t2209,t715);};___call_2dwith_2doutput_2dfile=t2208;var t718=___with_2dinput_2dfrom_2dport;var t719=___open_2dinput_2dfile;var t723=___close_2dinput_2dport;var t2216=function(k1263,t724,t725){var r=SPOCK.count(arguments);if(r)return r;var t2217=function(t1264){var t726=t1264;var t2218=function(k1265){var t2219=function(k1266){return t723(k1266,t726);};return ____25call_2dwith_2dsaved_2dvalues(k1265,t725,t2219);};return t718(k1263,t726,t2218);};return t719(t2217,t724);};___with_2dinput_2dfrom_2dfile=t2216;var t727=___with_2doutput_2dto_2dport;var t728=___open_2doutput_2dfile;var t732=___close_2doutput_2dport;var t2224=function(k1267,t733,t734){var r=SPOCK.count(arguments);if(r)return r;var t2225=function(t1268){var t735=t1268;var t2226=function(k1269){var t2227=function(k1270){return t732(k1270,t735);};return ____25call_2dwith_2dsaved_2dvalues(k1269,t734,t2227);};return t727(k1267,t735,t2226);};return t728(t2225,t733);};___with_2doutput_2dto_2dfile=t2224;var t2232=function(k1271,t736){var r=SPOCK.count(arguments);if(r)return r;var t737=undefined;var t2233=function(K){SPOCK.count(arguments,'t737');var buffer=arguments[1];var pos=0;var len=buffer.length;function read(n){if(pos>=len)return SPOCK.EOF;var str=buffer.substring(pos,pos+n);pos+=n;return str;}
return K(new SPOCK.Port('input',{read:read}));};t737=t2233;var t2234=SPOCK.jstring(t736);return t737(k1271,t2234);};___open_2dinput_2dstring=t2232;var t2236=function(K){SPOCK.count(arguments,'open-output-string');var buffer=[];function write(s){buffer.push(s);}
var port=new SPOCK.Port('output',{write:write});port.buffer=buffer;port.isStringPort=true;return K(port);};___open_2doutput_2dstring=t2236;var t2237=function(k1272,t739){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t2238=t739.isStringPort;var t742=t2238;var t2239=t742===undefined;var t741=t2239;var t2240;if(t741!==false){t2240=false;}
else{t2240=true;}
var t1048=t2240;var t2241;if(t1048!==false){var t2243=t739.buffer;var t2242=t2243.join("");var t744=t2242;var t2244=new SPOCK.String(t744);var t743=t2244;var t2245=(t739).buffer=[];t2241=t743;}
else{var t2246=SPOCK.error("bad argument type - not a string port",t739);t2241=t2246;}
return k1272(t2241);}};___get_2doutput_2dstring=t2237;var t2248=function(k1273,t745,t746){var r=SPOCK.count(arguments);if(r)return r;var t2249=function(t1274){var t747=t1274;return ___with_2dinput_2dfrom_2dport(k1273,t747,t746);};return ___open_2dinput_2dstring(t2249,t745);};___with_2dinput_2dfrom_2dstring=t2248;var t2252=function(k1275,t748){var r=SPOCK.count(arguments);if(r)return r;var t2253=function(t1276){var t749=t1276;var t2254=function(t1277){return ___get_2doutput_2dstring(k1275,t749);};return ___with_2doutput_2dto_2dport(t2254,t749,t748);};return ___open_2doutput_2dstring(t2253);};___with_2doutput_2dto_2dstring=t2252;var t750=___read_2dchar;var t751=___reverse;var t752=___peek_2dchar;var t753=___list_2d_3evector;var t754=___list_2d_3estring;var t2258=function(k1278){loop:while(true){return k1278(SPOCK.stdin);}};var t755=t2258;var t756=___string_2d_3enumber;var t2260=function(k1279,t757){var r=SPOCK.count(arguments);if(r)return r;var t2261=t757===undefined;var t1049=t2261;var t2262=function(t1280){var t758=t1280;var t760=undefined;var t761=undefined;var t762=undefined;var t763=undefined;var t764=undefined;var t765=undefined;var t766=undefined;var t767=undefined;var t2263=function(k1281,t768){var r=SPOCK.count(arguments);if(r)return r;var t2264=function(t1282){var t769=t1282;var t2265;if(t769!==false){return k1281(t769);t2265=undefined;}
else{return ___string_2d_3esymbol(k1281,t768);t2265=undefined;}};return t756(t2264,t768);};t760=t2263;var t2269=function(k1283){var t2270=function(t1284){var t770=t1284;var t773=SPOCK.EOF;var t2271=(t770)===(t773);var t1050=t2271;var t2272;if(t1050!==false){return k1283(t770);t2272=undefined;}
else{var t774=t770;var t2276=new SPOCK.Char("#");var t2275=SPOCK.eqvp(t770,t2276);var t1051=t2275;var t2277;if(t1051!==false){t2277=true;}
else{t2277=false;}
var t2274;if(t2277!==false){return t764(k1283);t2274=undefined;}
else{var t2281=new SPOCK.Char("(");var t2280=SPOCK.eqvp(t774,t2281);var t1052=t2280;var t2282;if(t1052!==false){t2282=true;}
else{t2282=false;}
var t2279;if(t2282!==false){var t2283=new SPOCK.Char(")");return t765(k1283,t2283);t2279=undefined;}
else{var t2287=new SPOCK.Char("[");var t2286=SPOCK.eqvp(t774,t2287);var t1053=t2286;var t2288;if(t1053!==false){t2288=true;}
else{t2288=false;}
var t2285;if(t2288!==false){var t2289=new SPOCK.Char("]");return t765(k1283,t2289);t2285=undefined;}
else{var t2293=new SPOCK.Char("{");var t2292=SPOCK.eqvp(t774,t2293);var t1054=t2292;var t2294;if(t1054!==false){t2294=true;}
else{t2294=false;}
var t2291;if(t2294!==false){var t2295=new SPOCK.Char("}");return t765(k1283,t2295);t2291=undefined;}
else{var t2299=new SPOCK.Char(",");var t2298=SPOCK.eqvp(t774,t2299);var t1055=t2298;var t2300;if(t1055!==false){t2300=true;}
else{t2300=false;}
var t2297;if(t2300!==false){var t2301=function(t1285){var t785=t1285;var t2303=new SPOCK.Char("@");var t2302=SPOCK.eqvp(t785,t2303);var t1056=t2302;var t2304;if(t1056!==false){var t2305=function(t1287){var t2306=function(t1286){var t787=t1286;return k1283(t787);};var t2308=SPOCK.intern("unquote-splicing");return ____25list(t2306,t2308,t1287);};return t761(t2305);t2304=undefined;}
else{var t2311=function(t1289){var t2312=function(t1288){var t788=t1288;return k1283(t788);};var t2314=SPOCK.intern("unquote");return ____25list(t2312,t2314,t1289);};return t761(t2311);t2304=undefined;}};return t752(t2301,t758);t2297=undefined;}
else{var t2320=new SPOCK.Char("`");var t2319=SPOCK.eqvp(t774,t2320);var t1057=t2319;var t2321;if(t1057!==false){t2321=true;}
else{t2321=false;}
var t2318;if(t2321!==false){var t2322=function(t1291){var t2323=function(t1290){var t791=t1290;return k1283(t791);};var t2325=SPOCK.intern("quasiquote");return ____25list(t2323,t2325,t1291);};return t761(t2322);t2318=undefined;}
else{var t2330=new SPOCK.Char("'");var t2329=SPOCK.eqvp(t774,t2330);var t1058=t2329;var t2331;if(t1058!==false){t2331=true;}
else{t2331=false;}
var t2328;if(t2331!==false){var t2332=function(t1293){var t2333=function(t1292){var t794=t1292;return k1283(t794);};var t2335=SPOCK.intern("quote");return ____25list(t2333,t2335,t1293);};return t761(t2332);t2328=undefined;}
else{var t2340=new SPOCK.Char(";");var t2339=SPOCK.eqvp(t774,t2340);var t1059=t2339;var t2341;if(t1059!==false){t2341=true;}
else{t2341=false;}
var t2338;if(t2341!==false){var t2342=function(t1294){return t761(k1283);};return t762(t2342);t2338=undefined;}
else{var t2347=new SPOCK.Char("\"");var t2346=SPOCK.eqvp(t774,t2347);var t1060=t2346;var t2348;if(t1060!==false){t2348=true;}
else{t2348=false;}
var t2345;if(t2348!==false){return t766(k1283);t2345=undefined;}
else{var t2352=new SPOCK.Char(")");var t2351=SPOCK.eqvp(t774,t2352);var t1061=t2351;var t2353;if(t1061!==false){t2353=true;}
else{var t2355=new SPOCK.Char("]");var t2354=SPOCK.eqvp(t774,t2355);var t1062=t2354;var t2356;if(t1062!==false){t2356=true;}
else{var t2358=new SPOCK.Char("}");var t2357=SPOCK.eqvp(t774,t2358);var t1063=t2357;var t2359;if(t1063!==false){t2359=true;}
else{t2359=false;}
t2356=t2359;}
t2353=t2356;}
var t2350;if(t2353!==false){return ____25error(k1283,"unexpected delimiter",t770);t2350=undefined;}
else{var t2361=(t770).character.match(/^\s$/);var t807=t2361;var t2363=null;var t2362=(t807)===(t2363);var t806=t2362;var t2364;if(t806!==false){t2364=false;}
else{t2364=true;}
var t1064=t2364;var t2365;if(t1064!==false){return t761(k1283);t2365=undefined;}
else{var t2367=function(t1297){var t810=t1297;var t1296=t810;var t2368=function(t1295){return t760(k1283,t1295);};return t767(t2368,t1296);};return ____25list(t2367,t770);t2365=undefined;}
t2350=t2365;}
t2345=t2350;}
t2338=t2345;}
t2328=t2338;}
t2318=t2328;}
t2297=t2318;}
t2291=t2297;}
t2285=t2291;}
t2279=t2285;}
t2274=t2279;}
t2272=t2274;}};return t750(t2270,t758);};t761=t2269;var t2373=function(k1298){var t2374=function(t1299){var t811=t1299;var t816=SPOCK.EOF;var t2375=(t811)===(t816);var t813=t2375;var t2376;if(t813!==false){t2376=t813;}
else{var t2378=new SPOCK.Char("\n");var t2377=t2378.character;var t819=t2377;var t2379=t811.character;var t820=t2379;var t2380=(t819)===(t820);t2376=t2380;}
var t812=t2376;var t2381;if(t812!==false){t2381=false;}
else{t2381=true;}
var t1065=t2381;var t2382;if(t1065!==false){return t762(k1298);t2382=undefined;}
else{return k1298(undefined);t2382=undefined;}};return t750(t2374,t758);};t762=t2373;var t2386=function(k1300){var t2387=function(t1301){var t821=t1301;var t2388=(t821).character.match(/^\s$/);var t824=t2388;var t2390=null;var t2389=(t824)===(t2390);var t823=t2389;var t2391;if(t823!==false){t2391=false;}
else{t2391=true;}
var t1066=t2391;var t2392;if(t1066!==false){var t2393=function(t1302){return t763(k1300);};return t750(t2393,t758);t2392=undefined;}
else{return k1300(t821);t2392=undefined;}};return t752(t2387,t758);};t763=t2386;var t2398=function(k1303){var t2399=function(t1304){var t827=t1304;var t830=SPOCK.EOF;var t2400=(t827)===(t830);var t1067=t2400;var t2401;if(t1067!==false){return ____25error(k1303,"unexpected EOF after `#'");t2401=undefined;}
else{var t831=t827;var t2405=new SPOCK.Char("t");var t2404=SPOCK.eqvp(t827,t2405);var t1068=t2404;var t2406;if(t1068!==false){t2406=true;}
else{var t2408=new SPOCK.Char("T");var t2407=SPOCK.eqvp(t827,t2408);var t1069=t2407;var t2409;if(t1069!==false){t2409=true;}
else{t2409=false;}
t2406=t2409;}
var t2403;if(t2406!==false){return k1303(true);t2403=undefined;}
else{var t2413=new SPOCK.Char("f");var t2412=SPOCK.eqvp(t827,t2413);var t1070=t2412;var t2414;if(t1070!==false){t2414=true;}
else{var t2416=new SPOCK.Char("F");var t2415=SPOCK.eqvp(t827,t2416);var t1071=t2415;var t2417;if(t1071!==false){t2417=true;}
else{t2417=false;}
t2414=t2417;}
var t2411;if(t2414!==false){return k1303(false);t2411=undefined;}
else{var t2421=new SPOCK.Char("(");var t2420=SPOCK.eqvp(t827,t2421);var t1072=t2420;var t2422;if(t1072!==false){t2422=true;}
else{t2422=false;}
var t2419;if(t2422!==false){var t2423=function(t1305){return t753(k1303,t1305);};var t2425=new SPOCK.Char(")");return t765(t2423,t2425);t2419=undefined;}
else{var t2429=new SPOCK.Char("%");var t2428=SPOCK.eqvp(t831,t2429);var t1073=t2428;var t2430;if(t1073!==false){t2430=true;}
else{var t2432=new SPOCK.Char("!");var t2431=SPOCK.eqvp(t831,t2432);var t1074=t2431;var t2433;if(t1074!==false){t2433=true;}
else{t2433=false;}
t2430=t2433;}
var t2427;if(t2430!==false){var t2434=function(t1308){var t846=t1308;var t1307=t846;var t2435=function(t1306){return ___string_2d_3esymbol(k1303,t1306);};return t767(t2435,t1307);};var t2438=new SPOCK.Char("#");return ____25list(t2434,t827,t2438);t2427=undefined;}
else{var t2442=new SPOCK.Char("\\");var t2441=SPOCK.eqvp(t831,t2442);var t1075=t2441;var t2443;if(t1075!==false){t2443=true;}
else{t2443=false;}
var t2440;if(t2443!==false){var t2444=function(t1309){var t849=t1309;var t2446=SPOCK.jstring("newline");var t2445=t2446.toLowerCase();var t852=t2445;var t2448=SPOCK.jstring(t849);var t2447=t2448.toLowerCase();var t853=t2447;var t2449=(t852)===(t853);var t1076=t2449;var t2450;if(t1076!==false){var t2451=new SPOCK.Char("\n");return k1303(t2451);t2450=undefined;}
else{var t2454=SPOCK.jstring("tab");var t2453=t2454.toLowerCase();var t858=t2453;var t2456=SPOCK.jstring(t849);var t2455=t2456.toLowerCase();var t859=t2455;var t2457=(t858)===(t859);var t1077=t2457;var t2458;if(t1077!==false){var t2459=new SPOCK.Char("\t");return k1303(t2459);t2458=undefined;}
else{var t2462=SPOCK.jstring("space");var t2461=t2462.toLowerCase();var t864=t2461;var t2464=SPOCK.jstring(t849);var t2463=t2464.toLowerCase();var t865=t2463;var t2465=(t864)===(t865);var t1078=t2465;var t2466;if(t1078!==false){var t2467=new SPOCK.Char(" ");return k1303(t2467);t2466=undefined;}
else{var t2470=SPOCK.jstring(t849);var t2469=t2470.length;var t868=t2469;var t2471=(0)===(t868);var t1079=t2471;var t2472;if(t1079!==false){return ____25error(k1303,"invalid character syntax");t2472=undefined;}
else{return ___string_2dref(k1303,t849,0);t2472=undefined;}
t2466=t2472;}
t2458=t2466;}
t2450=t2458;}};var t2475=null;return t767(t2444,t2475);t2440=undefined;}
else{return ____25error(k1303,"invalid `#' syntax",t827);t2440=undefined;}
t2427=t2440;}
t2419=t2427;}
t2411=t2419;}
t2403=t2411;}
t2401=t2403;}};return t750(t2399,t758);};t764=t2398;var t2479=function(k1310,t873){var r=SPOCK.count(arguments);if(r)return r;var t874=undefined;var t2480=function(k1311,t875){var r=SPOCK.count(arguments);if(r)return r;var t2481=function(t1312){var t876=t1312;var t879=SPOCK.EOF;var t2482=(t876)===(t879);var t1080=t2482;var t2483;if(t1080!==false){return ____25error(k1311,"unexpected EOF while reading list");t2483=undefined;}
else{var t881=t873;var t2485=t876.character;var t882=t2485;var t2486=t881.character;var t883=t2486;var t2487=(t882)===(t883);var t1081=t2487;var t2488;if(t1081!==false){var t2489=function(t1313){return t751(k1311,t875);};return t750(t2489,t758);t2488=undefined;}
else{var t2493=new SPOCK.Char(".");var t2492=SPOCK.eqvp(t2493,t876);var t1082=t2492;var t2494;if(t1082!==false){var t2495=function(t1314){var t886=t1314;var t2496=SPOCK.jstring(".");var t889=t2496;var t2497=SPOCK.jstring(t886);var t890=t2497;var t2498=(t889)===(t890);var t1083=t2498;var t2499;if(t1083!==false){var t2500=function(t1315){var t893=t1315;var t2501=function(t1316){var t2502=function(t1317){var t894=t1317;var t895=t873;var t2503=SPOCK.eqvp(t894,t895);var t1084=t2503;var t2504;if(t1084!==false){var t2505=function(t1318){return ___append(k1311,t1318,t893);};return t751(t2505,t875);t2504=undefined;}
else{return ____25error(k1311,"missing closing delimiter",t873);t2504=undefined;}};return t750(t2502,t758);};return t763(t2501);};return t761(t2500);t2499=undefined;}
else{var t2512=function(t1320){var t896=t1320;var t2513=new SPOCK.Pair(t896,undefined);var t1319=t2513;return t874(k1311,t1319,t875);};return t760(t2512,t886);t2499=undefined;}};var t2516=null;return t767(t2495,t2516);t2494=undefined;}
else{var t2518=function(t1322){var t898=t1322;var t2519=new SPOCK.Pair(t898,t875);var t1321=t2519;return t874(k1311,t1321);};return t761(t2518);t2494=undefined;}
t2488=t2494;}
t2483=t2488;}};return t763(t2481);};t874=t2480;var t2523=null;return t874(k1310,t2523);};t765=t2479;var t2525=function(k1323){var t900=undefined;var t2526=function(k1324,t901){var r=SPOCK.count(arguments);if(r)return r;var t2527=function(t1325){var t902=t1325;var t905=SPOCK.EOF;var t2528=(t902)===(t905);var t1085=t2528;var t2529;if(t1085!==false){return ____25error(k1324,"unexpected EOF while reading string");t2529=undefined;}
else{var t2532=new SPOCK.Char("\"");var t2531=t2532.character;var t908=t2531;var t2533=t902.character;var t909=t2533;var t2534=(t908)===(t909);var t1086=t2534;var t2535;if(t1086!==false){var t2536=function(t1326){return t754(k1324,t1326);};return t751(t2536,t901);t2535=undefined;}
else{var t2540=new SPOCK.Char("\\");var t2539=t2540.character;var t912=t2539;var t2541=t902.character;var t913=t2541;var t2542=(t912)===(t913);var t1087=t2542;var t2543;if(t1087!==false){var t2544=function(t1327){var t914=t1327;var t917=SPOCK.EOF;var t2545=(t914)===(t917);var t1088=t2545;var t2546;if(t1088!==false){return ____25error(k1324,"unexpected EOF while reading string");t2546=undefined;}
else{var t2550=new SPOCK.Char("n");var t2549=SPOCK.eqvp(t914,t2550);var t1089=t2549;var t2551;if(t1089!==false){t2551=true;}
else{t2551=false;}
var t2548;if(t2551!==false){var t2553=new SPOCK.Char("\n");var t2552=new SPOCK.Pair(t2553,t901);return t900(k1324,t2552);t2548=undefined;}
else{var t2557=new SPOCK.Char("t");var t2556=SPOCK.eqvp(t914,t2557);var t1090=t2556;var t2558;if(t1090!==false){t2558=true;}
else{t2558=false;}
var t2555;if(t2558!==false){var t2560=new SPOCK.Char("\t");var t2559=new SPOCK.Pair(t2560,t901);return t900(k1324,t2559);t2555=undefined;}
else{var t2562=new SPOCK.Pair(t914,t901);return t900(k1324,t2562);t2555=undefined;}
t2548=t2555;}
t2546=t2548;}};return t750(t2544,t758);t2543=undefined;}
else{var t2565=new SPOCK.Pair(t902,t901);return t900(k1324,t2565);t2543=undefined;}
t2535=t2543;}
t2529=t2535;}};return t750(t2527,t758);};t900=t2526;var t2568=null;return t900(k1323,t2568);};t766=t2525;var t2570=function(k1328,t931){var r=SPOCK.count(arguments);if(r)return r;var t932=undefined;var t2571=function(k1329,t933){var r=SPOCK.count(arguments);if(r)return r;var t2572=function(t1330){var t934=t1330;var t938=SPOCK.EOF;var t2573=(t934)===(t938);var t935=t2573;var t2574=function(t1331){var t1091=t1331;var t2575;if(t1091!==false){var t2576=function(t1332){return t754(k1329,t1332);};return t751(t2576,t933);t2575=undefined;}
else{var t2579=function(t1334){var t945=t1334;var t2580=new SPOCK.Pair(t945,t933);var t1333=t2580;return t932(k1329,t1333);};return t750(t2579,t758);t2575=undefined;}};var t1335=t2574;var t2583;if(t935!==false){return t1335(t935);t2583=undefined;}
else{var t2585=function(t1336){var t939=t1336;var t2586;if(t939!==false){t2586=t939;}
else{var t2587=(t934).character.match(/^\s$/);var t942=t2587;var t2589=null;var t2588=(t942)===(t2589);var t941=t2588;var t2590;if(t941!==false){t2590=false;}
else{t2590=true;}
t2586=t2590;}
return t1335(t2586);};var t2592=new SPOCK.Pair(new SPOCK.Char("{"),new SPOCK.Pair(new SPOCK.Char("}"),new SPOCK.Pair(new SPOCK.Char("("),new SPOCK.Pair(new SPOCK.Char(")"),new SPOCK.Pair(new SPOCK.Char("["),new SPOCK.Pair(new SPOCK.Char("]"),new SPOCK.Pair(new SPOCK.Char(";"),new SPOCK.Pair(new SPOCK.Char("\""),null))))))));return ___memv(t2585,t934,t2592);t2583=undefined;}};return t752(t2572,t758);};t932=t2571;return t932(k1328,t931);};t767=t2570;return t761(k1279);};var t1337=t2262;var t2597;if(t1049!==false){return t755(t1337);t2597=undefined;}
else{return t1337(t757);t2597=undefined;}};___read=t2260;var t2600=function(k1338,t947,t948){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t2602=SPOCK.jstring(t947);var t2603=t948===undefined;var t950=t2603;var t2604;if(t950!==false){t2604=false;}
else{t2604=true;}
var t1092=t2604;var t2605;if(t1092!==false){var t2606=SPOCK.callback(t948);t2605=t2606;}
else{t2605=false;}
var t2601=SPOCK.load(t2602,t2605);return k1338(t2601);}};___load=t2600;var t2608=function(K){SPOCK.count(arguments,'%error');SPOCK.error.apply(SPOCK.global,Array.prototype.slice.call(arguments,1));};____25error=t2608;___error=____25error;var t2609=function(k1339,t952){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){var t2611=t952===undefined;var t1093=t2611;var t2612;if(t1093!==false){t2612=0;}
else{t2612=t952;}
var t2610=SPOCK.exit(t2612);return k1339(t2610);}};___exit=t2609;var t2614=function(k1340,t954){var r=SPOCK.count(arguments);if(r)return r;var t2615=(new Date()).getTime();var t955=t2615;var t2616=t954===undefined;var t1094=t2616;var t2617;if(t1094!==false){return k1340(t955);t2617=undefined;}
else{var t2619=function(t1341){var t2620=(new Date()).getTime();var t958=t2620;var t2621=(t958)-(t955);return k1340(t2621);};return t954(t2619);t2617=undefined;}};___milliseconds=t2614;var t2624=function(k1342,t959){var t959=SPOCK.rest(arguments,1);var t2625=function(t1343){return ___newline(k1342);};return ___for_2deach(t2625,___display,t959);};___print=t2624;var t2628=function(k1344,t960){var t960=SPOCK.rest(arguments,1);var t2630=null;var t2629=(t960)===(t2630);var t1095=t2629;var t2631;if(t1095!==false){var t2632=function(k1345,t964){var r=SPOCK.count(arguments);if(r)return r;loop:while(true){return k1345(t964);}};return k1344(t2632);t2631=undefined;}
else{var t965=undefined;var t2635=function(k1346,t966){var r=SPOCK.count(arguments);if(r)return r;var t2636=t966.car;var t967=t2636;var t2637=t966.cdr;var t968=t2637;var t2639=null;var t2638=(t968)===(t2639);var t1096=t2638;var t2640;if(t1096!==false){t2640=t967;}
else{var t2641=function(k1347,t974){var r=SPOCK.count(arguments);if(r)return r;var t2642=function(t1349){var t2643=function(t1348){return t967(k1347,t1348);};return t1349(t2643,t974);};return t965(t2642,t968);};t2640=t2641;}
return k1346(t2640);};t965=t2635;return t965(k1344,t960);t2631=undefined;}};___o=t2628;var t2649=function(K){SPOCK.count(arguments,'%');var o={};for(var i=1;i<arguments.length;i+=2){var x=arguments[i];if(typeof x==='string')o[x]=arguments[i+1];else if(x instanceof SPOCK.String)
o[x.name]=arguments[i+1];else SPOCK.error('(%) object key not a string or symbol',x);}
return K(o);};____25=t2649;var t2650=function(K){SPOCK.count(arguments,'native');var func=arguments[1];return K(function(k){var args=Array.prototype.splice.call(arguments,1);return k(func.apply(SPOCK.global,args));});};___native=t2650;var t2651=function(K){SPOCK.count(arguments,'native-method');var func=arguments[1];return K(function(k){var args=Array.prototype.splice.call(arguments,2);return k(func.apply(arguments[1],args));});};___native_2dmethod=t2651;var t2652=function(K){SPOCK.count(arguments,'bind-method');var func=arguments[1];var that=arguments[2];return K(function(){return func.apply(that,arguments);});};___bind_2dmethod=t2652;var t2653=function(K){SPOCK.count(arguments,'jstring');var x=arguments[1];if(typeof x==='string')return K(x);else if(x instanceof SPOCK.String)return K(x.normalize());else if(x instanceof SPOCK.Char)return K(x.character);else return K(x);};___jstring=t2653;return k1097(undefined);};SPOCK.run(t1350);SPOCK.flush();