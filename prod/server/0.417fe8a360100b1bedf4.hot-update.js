exports.id=0,exports.modules={"./src/server/server.js":function(e,r,t){"use strict";t.r(r);var o=t("./build/contracts/FlightSuretyApp.json"),s=t("./src/server/config.json"),n=t("web3"),l=t.n(n),c=t("express"),a=t.n(c);const i=s.localhost,u=new l.a(new l.a.providers.WebsocketProvider(i.url.replace("http","ws")));u.eth.defaultAccount=u.eth.accounts[0];const d=new u.eth.Contract(o.abi,i.appAddress),h=[0,10,20,30,40,50],f=u.utils.toWei("1","ether"),g={};u.eth.getAccounts().then(e=>{for(let r=0;r<10;r++)d.methods.registerOracle().send({from:e[r],value:f},(t,o)=>{if(t)throw new Error(t);console(`Oracle ${r} added`),d.methods.getMyIndexes().send({from:e[r]},(t,o)=>{if(t)throw new Error(t);g[e[r]]=o})})}),d.events.OracleRequest({fromBlock:0},(function(e,r){e&&console.log(e),console.log(r);const t=r.returnValues.index,o=r.returnValues.airline,s=r.returnValues.flight,n=r.returnValues.flight,l=h[Math.floor(Math.random()*h.length)];for(const e in g)g[e].includes(t)&&d.methods.submitOracleResponse(t,o,s,n,l).send({from:e},(r,t)=>{if(r)throw new Error(r);console.log(t),console.log(`Submitted oracle response for ${e} airline ${o} flight ${s} time ${new Date(1e3*n)} with status code ${l}`)})}));const p=a()();p.get("/api",(e,r)=>{r.send({message:"An API for use with your Dapp!"})}),r.default=p}};