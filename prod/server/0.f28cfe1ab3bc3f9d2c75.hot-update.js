exports.id=0,exports.modules={"./src/server/server.js":function(e,t,r){"use strict";r.r(t);var o=r("./build/contracts/FlightSuretyApp.json"),s=r("./src/server/config.json"),n=r("web3"),l=r.n(n),c=r("express"),a=r.n(c);const i=s.localhost,u=new l.a(new l.a.providers.WebsocketProvider(i.url.replace("http","ws")));u.eth.defaultAccount=u.eth.accounts[0];const h=new u.eth.Contract(o.abi,i.appAddress),d=[0,10,20,30,40,50],f=u.utils.toWei("1","ether"),g={};u.eth.getAccounts().then(e=>{for(let t=0;t<10;t++)h.methods.registerOracle().send({from:e[t],value:f,gas:6721975},(r,o)=>{if(r)throw new Error(r);h.methods.getMyIndexes().send({from:e[t]},(r,o)=>{if(r)throw new Error(r);g[e[t]]=o})})}),h.events.OracleRequest({fromBlock:0},(function(e,t){e&&console.log(e),console.log(t);const r=t.returnValues.index,o=t.returnValues.airline,s=t.returnValues.flight,n=t.returnValues.flight,l=d[Math.floor(Math.random()*d.length)];for(const e in g)g[e].includes(r)&&h.methods.submitOracleResponse(r,o,s,n,l).send({from:e},(t,r)=>{if(t)throw new Error(t);console.log(r),console.log(`Submitted oracle response for ${e} airline ${o} flight ${s} time ${new Date(1e3*n)} with status code ${l}`)})}));const p=a()();p.get("/api",(e,t)=>{t.send({message:"An API for use with your Dapp!"})}),t.default=p}};