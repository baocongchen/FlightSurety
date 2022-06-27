exports.id=0,exports.modules={"./src/server/server.js":function(e,t,r){"use strict";r.r(t);var s=r("./build/contracts/FlightSuretyApp.json"),o=r("./src/server/config.json"),n=r("web3"),l=r.n(n),c=r("express"),a=r.n(c);const i=o.localhost,u=new l.a(new l.a.providers.WebsocketProvider(i.url.replace("http","ws")));u.eth.defaultAccount=u.eth.accounts[0];const h=new u.eth.Contract(s.abi,i.appAddress),d=[0,10,20,30,40,50],f=u.utils.toWei("1","ether"),g={};u.eth.getAccounts().then(e=>{for(let t=1;t<10;t++)h.methods.registerOracle().send({from:e[t],value:f,gas:6721975},(r,s)=>{if(r)throw new Error(r);h.methods.getMyIndexes().send({from:e[t]},(r,s)=>{if(r)throw new Error(r);g[e[t]]=s})})}),h.events.OracleRequest((function(e,t){e&&console.log(e),console.log(t);const r=t.returnValues.index,s=t.returnValues.airline,o=t.returnValues.flight,n=t.returnValues.flight,l=d[Math.floor(Math.random()*d.length)];for(const e in g)g[e].includes(r)&&h.methods.submitOracleResponse(r,s,o,n,l).send({from:e},(t,r)=>{if(t)throw new Error(t);console.log(r),console.log(`Submitted oracle response for ${e} airline ${s} flight ${o} time ${new Date(1e3*n)} with status code ${l}`)})}));const p=a()();p.get("/api",(e,t)=>{t.send({message:"An API for use with your Dapp!"})}),t.default=p}};