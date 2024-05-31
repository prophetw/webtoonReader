// const baseUrl = "http://192.168.1.11:3000";
// const hostname = window.location.hostname;
// const baseUrl = `http://${hostname}:3000`;
const baseUrl = "";
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let action = isMobile ? 'touchstart' : 'click';

let curComicName = 'jmtt';
let curComicEpisode = 0;
let curEpisodesAry = []
let scrollInterval; // 用于存储定时器ID
let scrollSpeed = 2; // 滚动速度，每次滚动1像素
let isScrolling = false; // 标记是否正在滚动
let scrollAnimationFrame;
let autoNext = false;
let autoPlay = false;

function hideAddressBar() {
	if (!window.location.hash) {
		if (document.height < window.outerHeight) {
			document.body.style.height = (window.outerHeight + 50) + 'px';
		}
		setTimeout(function () {
			window.scrollTo(0, 1);
		}, 50);
	}
}

function smoothAutoScroll(element) {
	var lastPosition = element.scrollTop;
	isScrolling = true;
	let consecutiveSamePositionCount = 0; // 连续相同位置的计数器

	function scrollStep() {
		if (element.scrollTop < element.scrollHeight - element.clientHeight) {
			element.scrollTop += scrollSpeed;
			if (element.scrollTop !== lastPosition) {
				lastPosition = element.scrollTop;
				consecutiveSamePositionCount = 0;
				scrollAnimationFrame = requestAnimationFrame(scrollStep);
			} else {
				consecutiveSamePositionCount++;
				if (consecutiveSamePositionCount > 10) { // 假设连续10次位置不变表示滚动到底部
					stopSmoothScroll(); // 停止动画
					if (autoNext) {
						// loadNextEpisode(true);
						loadNextEpisode();
					}
				} else {
					scrollAnimationFrame = requestAnimationFrame(scrollStep);
				}
			}
		} else {
			stopSmoothScroll(); // 如果到达底部，停止动画
			if (autoNext) {
				if (element.scrollTop !== 0) {
					// loadNextEpisode(true);
					loadNextEpisode();
				}
			}
		}
	}
	scrollAnimationFrame = requestAnimationFrame(scrollStep);
}

function stopSmoothScroll() {
	cancelAnimationFrame(scrollAnimationFrame);
	isScrolling = false;
}

function scrollToTop() {
	const scrollEle = document.getElementById('content');
	scrollEle.scrollTop = 0;
}

function scrollToBottom() {
	const scrollEle = document.getElementById('content');
	scrollEle.scrollTop = scrollEle.scrollHeight;
}

function fetchComics() {
	showLoading();
	fetch(`${baseUrl}/api/comics`)
		.then(response => response.json())
		.then(async comics => {
			const comicsContainer = document.getElementById('comics');
			comicsContainer.innerHTML = '';
			comics.forEach(comic => {
				const details = document.createElement('details');
				const summary = document.createElement('summary');
				summary.textContent = comic;
				details.appendChild(summary);
				// const episodesContainer = document.createElement('div');
				// episodesContainer.id = `episodes-${comic}`;
				// details.appendChild(episodesContainer);
				comicsContainer.appendChild(details);

				summary.addEventListener('click', () => {
					fetchEpisodes(comic);
					curComicName = comic;
					document.getElementById('toggleEpisodesList').click();
				});
			});
			hideLoading();
			try {
				const lastReadInfoStr = localStorage.getItem('lastReadInfo');
				if (lastReadInfoStr) {
					const lastReadInfo = JSON.parse(lastReadInfoStr);
					const { comicName, episode } = lastReadInfo;

					const isConfirmed = await confirm('请确认', `上次阅读到${comicName}-${episode}, 是否需要定位到该位置?`, 4000, false)
					if (isConfirmed) {
						curComicName = comicName;
						await fetchEpisodes(comicName);
						curComicEpisode = curEpisodesAry.indexOf(episode);
						// const episodeName = curEpisodesAry[curComicEpisode];
						console.log(' curComicEpisode', curComicEpisode)
						fetchImages(comicName, episode);
					} else {

					}
					// if(lastComicName === comicName && lastEpisode === episode){
					// 	// 读取上次阅读的位置
					// 	const lastReadPosition = localStorage.getItem('lastReadPosition');
					// 	if(lastReadPosition){
					// 		const scrollEle = document.getElementById('content');
					// 		scrollEle.scrollTop = +lastReadPosition;
					// 	}
					// }
				}

			} catch (error) {

			}
		})
		.catch(error => {
			console.error('Error fetching comics:', error)
			hideLoading();
		});
}

function fetchEpisodes(comicName) {
	showLoading();
	return fetch(`${baseUrl}/api/comics/${comicName}`)
		.then(response => response.json())
		.then(episodes => {
			curEpisodesAry = episodes;
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
			hideLoading();
		})
		.catch(error => {
			console.error('Error fetching episodes:', error)
			hideLoading();
		});
}

function showLoading() {
	const loading = document.getElementById('loading');
	loading.style.display = 'flex';
}
function hideLoading() {
	const loading = document.getElementById('loading');
	loading.style.display = 'none';
}

function loadImagesSequentially(imageUrls, container) {
	let index = 0;
	let res, reject;
	const promise = new Promise((resolve, reject) => {
		res = resolve;
		reject = reject;
	});
	function loadImage() {
		// no need to wait all images loaded
		if (index > 10) {
			res();
			hideLoading();
		}
		if (index < imageUrls.length) {
			const imageUrl = imageUrls[index];
			const img = document.createElement('img');
			if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
				img.src = imageUrl;
			} else {
				img.src = `${baseUrl}${imageUrl}`;
			}
			img.onload = () => {
				container.appendChild(img);
				index++;
				loadImage();
			};
			img.onerror = () => {
				console.error('Error loading image:', imageUrl);
				index++;
				loadImage();
			};
		} else {
			res();
			hideLoading();
		}
	}
	loadImage();
	return promise;
}

function warning(message, duration) {
	const warningPanel = document.getElementById('warningPanel');
	const warningMessage = document.getElementById('warningMessage');
	warningMessage.innerHTML = message;
	warningPanel.style.display = 'block';
	setTimeout(() => {
		warningPanel.style.display = 'none';
	}, duration);
}

// warning('请点击漫画名称查看漫画列表', 3000);


function fetchImages(comicName, episode, imagesContainer) {
	if (!episode) {
		warning('没有找到该集', 2000);
		return
	}
	try {
		const lastReadInfo = {
			comicName: comicName, episode: episode
		}
		localStorage.setItem('lastReadInfo', JSON.stringify(lastReadInfo));
	} catch (error) {

	}
	showLoading();
	fetch(`${baseUrl}/api/comics/${comicName}/${episode}`)
		.then(response => response.json())
		.then(async images => {
			document.title = `${comicName} - ${episode}`;
			document.getElementById('header').innerHTML = `${comicName} - ${episode}`;
			imagesContainer = imagesContainer ? imagesContainer : document.getElementById('content');
			imagesContainer.innerHTML = '';
			if (autoPlay) {
				console.log(' autoPlay');
				await loadImagesSequentially(images, imagesContainer);
				hideLoading();
				smoothAutoScroll(document.getElementById('content'));
			} else {
				loadImagesSequentially(images, imagesContainer);
				hideLoading();
			}
		})
		.catch(error => {
			console.error('Error fetching images:', error)
			hideLoading();

		});
}


function confirm(title, message, duration, dftResult = true) {
	// notify user with a message and title for a duration 
	// with two buttons, confirm and cancel  
	// if confirm is clicked, return true, otherwise return false
	// if nothing is done, return true after duration
	const confirmPanel = document.getElementById('confirmPanel');
	const confirmTitle = document.getElementById('confirmTitle');
	const confirmMessage = document.getElementById('confirmMessage');
	const confirmBtn = document.getElementById('confirmBtn');
	const cancelBtn = document.getElementById('cancelBtn');
	confirmTitle.innerHTML = title;
	confirmMessage.innerHTML = message;
	confirmPanel.style.display = 'block';
	let interval;
	return new Promise((resolve, reject) => {
		confirmBtn.onclick = () => {
			confirmPanel.style.display = 'none';
			duration = 0;
			if (interval) {
				clearInterval(interval);
				interval = null
			}
			resolve(true);
			confirmPanel.style.display = 'none';
		}
		cancelBtn.onclick = () => {
			confirmPanel.style.display = 'none';
			duration = 0;
			if (interval) {
				clearInterval(interval);
				interval = null
			}
			resolve(false);
			confirmPanel.style.display = 'none';
		}
		// update rest time in message 
		interval = setInterval(() => {
			duration -= 1000;
			confirmMessage.innerHTML = `${message} <br> ${duration / 1000} seconds left`;
			if (duration <= 0) {
				clearInterval(interval);
				interval = null
				resolve(dftResult);
				confirmPanel.style.display = 'none';
			}
		}, 1000);

	})
}
// confirm('Next Episode', 'Loading next episode...', 2000).then(isConfirmed => {
// 	console.log('isConfirmed', isConfirmed);
// })

function loadNextEpisode(needConfirm = false) {
	stopSmoothScroll()
	if (needConfirm) {
		confirm('自动播放下一集', '3秒之后自动播放下一集', 3000).then(isConfirmed => {
			if (isConfirmed) {
				curComicEpisode = (parseInt(curComicEpisode) + 1).toString();
				const episodeName = curEpisodesAry[curComicEpisode];
				fetchImages(curComicName, episodeName);
			}
		});
	} else {
		curComicEpisode = (parseInt(curComicEpisode) + 1).toString();
		const episodeName = curEpisodesAry[curComicEpisode];
		fetchImages(curComicName, episodeName);
	}
}

function loadPreviousEpisode() {
	stopSmoothScroll()
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
		hideEpisodesPanel();
		hideSettingPanel();
	}
});

function hideComicPanel() {
	const comicsPanel = document.getElementById('comics');
	comicsPanel.style.transform = 'translateX(-100%)';
}
function hideEpisodesPanel() {
	const episodesPanel = document.getElementById('episodes');
	episodesPanel.style.transform = 'translateX(-100%)';
}
function hideSettingPanel() {
	const settingPanel = document.getElementById('settingPanel');
	settingPanel.style.transform = 'translateX(100%)';
}

document.getElementById('toggleEpisodesList').addEventListener('click', () => {
	const episodesPanel = document.getElementById('episodes');
	// 切换episodes面板的显示状态
	if (episodesPanel.style.transform === 'translateX(0px)') {
		episodesPanel.style.transform = 'translateX(-100%)';
	} else {
		episodesPanel.style.transform = 'translateX(0px)';
		hideComicPanel();
		hideSettingPanel();
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



document.getElementById('next').addEventListener(action, e => {
	loadNextEpisode();
});
document.getElementById('prev').addEventListener(action, e => {
	loadPreviousEpisode();
});

document.getElementById('play').addEventListener(action, e => {
	const scrollEle = document.getElementById('content');
	if (isScrolling) {
		stopSmoothScroll();
	} else {
		smoothAutoScroll(scrollEle)
	}
});
// 其他已有的函数继续保持不变

function initSettings() {
	const settingBtn = document.getElementById('setting');
	const settingPanel = document.getElementById('settingPanel');
	settingBtn.addEventListener(action, () => {
		const isShow = settingPanel.style.transform === 'translateX(0px)';
		if (isShow) {
			// unshow
			settingPanel.style.transform = 'translateX(100%)';
		} else {
			// show
			settingPanel.style.transform = 'translateX(0px)';
			hideComicPanel();
			hideEpisodesPanel();
		}
	})
	// 初始化滚动速度
	scrollSpeed = localStorage.getItem('scrollSpeed') || 2;
	scrollSpeed = +scrollSpeed;
	autoNext = !!localStorage.getItem('autoNext');

	lastReadInfo = !!localStorage.getItem('lastReadInfo');
	console.log(' lastReadInfo ', lastReadInfo);
	// update autoNext element checkbox 
	const autoNextEle = document.getElementById('autoNext');
	autoNextEle.checked = autoNext;
	autoNextEle.addEventListener('change', (e) => {
		autoNext = e.target.checked;
		if (autoNext) {
			localStorage.setItem('autoNext', 1);
		} else {
			localStorage.removeItem('autoNext');
		}
	})

	autoPlay = !!localStorage.getItem('autoPlay');
	// update autoPlay element checkbox
	const autoPlayEle = document.getElementById('autoPlay');
	autoPlayEle.checked = autoPlay;
	autoPlayEle.addEventListener('change', (e) => {
		autoPlay = e.target.checked;
		if (autoPlay) {
			localStorage.setItem('autoPlay', 1);
		} else {
			localStorage.removeItem('autoPlay');
		}
	})


	const dim = document.getElementById('dim')

	dim.addEventListener('click', (e) => {
setBrightness(50)
})
	const speedValListContainer = document.getElementById('speed-setting')
	const speedList = [2, 3, 4, 5, 6, 7, 8, 16]
	speedList.map(speed => {
		const speedEle = document.createElement('span')
		speedEle.classList.add('play-speed')
		if (+scrollSpeed === speed) {
			speedEle.classList.add('active')
		}
		speedEle.innerHTML = speed
		speedValListContainer.appendChild(speedEle)
	})

	// 初始化滚动状态
	isScrolling = false;
	// 初始化滚动动画ID
	scrollAnimationFrame = null;
}

initSettings();

document.body.addEventListener(action, (e) => {
	const { target } = e
	if (target) {
		// if class contains xx
		if (target.classList.contains('play-speed')) {
			// handle speed change 
			const speed = target.innerHTML;
			localStorage.setItem('scrollSpeed', +speed);
			scrollSpeed = +speed;
			/** @type {HTMLCollectionOf<HTMLElement>;} */
			const speedValList = document.getElementsByClassName('play-speed');
			[...speedValList].map((ele) => {
				ele.classList.remove('active');
			})
			target.classList.add('active');
		}
		if (target.id === 'back-to-top') {
			scrollToTop();
		}
		if (target.id === 'back-to-bottom') {
			scrollToBottom();
		}

	}
})

// 初始化加载漫画列表
document.addEventListener('DOMContentLoaded', fetchComics);

let video;
// 创建一个无声视频并播放
function insertInvisibleVideo() {
	// 创建一个video元素
	video = document.createElement('video');

	// 设置视频属性，使其无声且循环播放
	video.setAttribute('playsinline', '');
	video.setAttribute('muted', '');
	video.setAttribute('loop', '');

	// 添加一个透明的视频源
	video.src = './demo.mp4';

	// 将视频添加到页面中，但不显示
	video.style.position = 'absolute';
	video.style.width = '1px';
	video.style.height = '1px';
	video.style.opacity = '0';
	document.body.appendChild(video);
}

function playInvisibleVideo() {
	// 开始播放视频
	video.play()
		.catch(error => warning('Error attempting to play video:', 2000));
}

function stopInvisibleVideo() {
	// 开始播放视频
	video.stop()
}

insertInvisibleVideo();
function setBrightness(value) {
            document.body.style.filter = `brightness(${value}%)`;
        }

