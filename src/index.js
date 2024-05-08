// const baseUrl = "http://192.168.1.11:3000";
// const hostname = window.location.hostname;
// const baseUrl = `http://${hostname}:3000`;
const baseUrl = "";
const isMobile =  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

let curComicName = 'jmtt';
let curComicEpisode = 0;
let curEpisodesAry = []
let scrollInterval; // 用于存储定时器ID
let scrollSpeed = 1; // 滚动速度，每次滚动1像素
let isScrolling = false; // 标记是否正在滚动

function startAutoScroll(element) {
    scrollInterval = setInterval(function() {
        if (element.scrollTop < element.scrollHeight - element.clientHeight) {
            element.scrollTop += scrollSpeed; // 每次滚动1像素
						isScrolling = true;
        } else {
            stopAutoScroll(); // 如果滚动到底部，自动停止
        }
    }, 10);
}

function stopAutoScroll() {
    clearInterval(scrollInterval);
		isScrolling = false;
}

function fetchComics() {
	fetch(`${baseUrl}/api/comics`)
			.then(response => response.json())
			.then(comics => {
				const comicsContainer = document.getElementById('comics');
				comicsContainer.innerHTML = '';
				comics.forEach(comic => {
						const details = document.createElement('details');
						const summary = document.createElement('summary');
						summary.textContent = comic;
						details.appendChild(summary);
						const episodesContainer = document.createElement('div');
						episodesContainer.id = `episodes-${comic}`;
						details.appendChild(episodesContainer);
						comicsContainer.appendChild(details);
						
						summary.addEventListener('click', () => {
							fetchEpisodes(comic, episodesContainer);
							curComicName = comic;
							document.getElementById('toggleEpisodesList').click();
						});
				});
			})
			.catch(error => console.error('Error fetching comics:', error));
}

function fetchEpisodes(comicName, episodesContainer) {
	fetch(`${baseUrl}/api/comics/${comicName}`)
			.then(response => response.json())
			.then(episodes => {
					curEpisodesAry = episodes;
					episodesContainer.innerHTML = '';
					const episodesTitle = document.createElement('h2');
					episodesTitle.textContent = 'Episodes';
					const episodesDom = document.getElementById('episodes');
					episodesDom.innerHTML = '';
					episodes.forEach((episode, index) => {
							const episodeDiv = document.createElement('div');
							episodeDiv.textContent = episode;
							episodesDom.appendChild(episodeDiv);
							episodeDiv.onclick = () => {
								fetchImages(comicName, episode);
								curComicEpisode = index;
								document.getElementById('toggleEpisodesList').click();
							};
					});
			})
			.catch(error => console.error('Error fetching episodes:', error));
}
function fetchImages(comicName, episode, imagesContainer) {
	fetch(`${baseUrl}/api/comics/${comicName}/${episode}`)
			.then(response => response.json())
			.then(images => {
					document.title = `${comicName} - ${episode}`;
					document.getElementById('header').innerHTML = `${comicName} - ${episode}`;
					imagesContainer = imagesContainer ? imagesContainer : document.getElementById('content');
					imagesContainer.innerHTML = '';
					images.forEach(imageUrl => {
							const img = document.createElement('img');
							if(imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
								img.src = imageUrl;
							}else{
								img.src = `${baseUrl}${imageUrl}`;
							}
							imagesContainer.appendChild(img);
					});
			})
			.catch(error => console.error('Error fetching images:', error));
}

function loadNextEpisode() {
	curComicEpisode = (parseInt(curComicEpisode) + 1).toString();
	const episodeName = curEpisodesAry[curComicEpisode];
	fetchImages(curComicName, episodeName);
}

function loadPreviousEpisode() {
	curComicEpisode = (parseInt(curComicEpisode) - 1).toString();
	const episodeName = curEpisodesAry[curComicEpisode];
	fetchImages(curComicName, episodeName);
}


document.getElementById('toggleComicsList').addEventListener('click', () => {
	const comicsPanel = document.getElementById('comics');
	// 切换comics面板的显示状态
	if (comicsPanel.style.transform === 'translateX(0px)') {
			comicsPanel.style.transform = 'translateX(-100%)';
	} else {
			comicsPanel.style.transform = 'translateX(0px)';
			document.getElementById('episodes').style.transform = 'translateX(-100%)';  // 同时确保episodes面板是隐藏的
	}
});

document.getElementById('toggleEpisodesList').addEventListener('click', () => {
	const episodesPanel = document.getElementById('episodes');
	// 切换episodes面板的显示状态
	if (episodesPanel.style.transform === 'translateX(0px)') {
			episodesPanel.style.transform = 'translateX(-100%)';
	} else {
			episodesPanel.style.transform = 'translateX(0px)';
			document.getElementById('comics').style.transform = 'translateX(-100%)';  // 同时确保comics面板是隐藏的
	}	

});

let touchStartX = 0;
let touchEndX = 0;

function handleGesture() {
    const minSwipeDistance = 50; // 设置最小的滑动距离为50像素，以区分滑动和轻触
    if (touchEndX + minSwipeDistance < touchStartX) {
        loadNextEpisode(); // 从右向左滑
    }
    if (touchEndX > touchStartX + minSwipeDistance) {
        loadPreviousEpisode(); // 从左向右滑
    }
}

// document.getElementById('content').addEventListener('touchstart', e => {
//     touchStartX = e.changedTouches[0].screenX;
// });

// document.getElementById('content').addEventListener('touchend', e => {
//     touchEndX = e.changedTouches[0].screenX;
//     handleGesture();
// });


let action = isMobile ? 'touchstart' : 'click';

document.getElementById('next').addEventListener(action, e => {
	loadNextEpisode();
});
document.getElementById('prev').addEventListener(action, e => {
	loadPreviousEpisode();
});

document.getElementById('play').addEventListener(action, e => {
	if(isScrolling){
		if(scrollSpeed === 1){
			scrollSpeed = 2;
		} else if(scrollSpeed === 2){
			scrollSpeed = 3;
		} else if(scrollSpeed === 3){
			scrollSpeed = 4;
		} else if (scrollSpeed === 4){
			scrollSpeed = 1;
			stopAutoScroll();
		}
	} else{
		startAutoScroll(document.getElementById('content'));
	}
});
// 其他已有的函数继续保持不变


// 初始化加载漫画列表
document.addEventListener('DOMContentLoaded', fetchComics);
