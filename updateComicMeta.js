const fs = require('fs');


const init = ()=>{
	const comicAryStr = fs.readFileSync('comicList.json', 'utf8');
	const comicAry = JSON.parse(comicAryStr);
	const comicMetaStr = fs.readFileSync('comicMeta.json', 'utf8');
	let comicMeta = {};
	try {
		comicMeta = JSON.parse(comicMetaStr);
	} catch (error) {
		// 
		comicMeta = {};
	}
	// console.log(comicMeta);

	if(Array.isArray(comicAry)){
		comicAry.map((comicName)=>{
			if(comicMeta[comicName]){

			}else{
				comicMeta[comicName] = {
					"tags":[],
					"cover":"",
					"score": 0
				}
			}
		})
		const str = JSON.stringify(comicMeta, null, 2);
		fs.writeFileSync('comicMeta.json', str, {
			encoding: 'utf-8'
		});
	}
}

init();