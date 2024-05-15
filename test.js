const timer = setInterval(()=>{
	console.log(' this is test --- ');
}, 10)

const waitFor = (ms) => new Promise(r => setTimeout(r, ms));

const init = async ()=>{
	const resultData = {
		code: 0,
		msg: 'done'
	};
	console.log(' init ');
	await waitFor(20000);
	console.log(' init 1 ');

 	clearInterval(timer)
	return resultData;
}

init()