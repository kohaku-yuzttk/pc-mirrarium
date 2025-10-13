// 画面呼び出し
function showScreen(id) {
  document.querySelectorAll('section').forEach(sec => {
    sec.style.display = 'none';
  });
  document.getElementById(id).style.display = 'block';
}
// ロード画面
function showLoading() {
  document.getElementById('loading').style.display = 'flex';
}
function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}
// スプレッドシートから探索者情報読み込み
async function loadSeekerData() {
  const response = await fetch("https://script.google.com/macros/s/AKfycbyA5hyeyEuZQonR4ZyRjmk1lQIKB9RRFPuObIy0dxksPQPKTU72QrINVnOlhhgzWIQB/exec");
  const data = await response.json();
  console.log(data); // データ確認用
  return data;
}
// カルーセル初期化
async function initCarousel() {
  showLoading(); // ロード画面表示
  const seekers = await loadSeekerData();
  const carousel = document.getElementById('carousel');
  carousel.innerHTML = ''; // 既存のカードをクリア

  seekers.forEach(seeker => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = seeker.id || seeker.name; // 詳細画面用にIDを保持
	
	// focusが指定されていれば使い、なければ center top を使う
	const focus = seeker.focus || 'center top';
	// カードタイプ：ダミーの場合ダミークラス適用
	if (seeker.type === 'dummy') {
		card.classList.add('dummy');
	}

    // カードの中身をHTMLで構築
    card.innerHTML = `
      <img src="${seeker.image}" alt="${seeker.name}" style="object-position:${focus};">
      <h2>${seeker.name}</h2>
      <p>職業：${seeker.job}<br>出身シナリオ：${seeker.scenario}</p>
    `;

    // アクティブカードクリックで詳細画面へ
    card.addEventListener('click', () => {
      if (card.classList.contains('active')) {
        showSeekerDetail(seeker);
      }
    });

    carousel.appendChild(card);
  });
  // 判定タイミング調整
	setTimeout(() => {
		updateActiveCard(); // 初期の中央判定
	}, 100);
  hideLoading(); // ロード画面非表示
}
// 探索者カード生成(ローカル)
async function loadSeekerData_local() {
fetch('pc-data.json')
	.then(response => response.json())
	.then(data => {
		const container = document.getElementById('carousel');
		// カード生成
		data.forEach(seeker => {
			const card = document.createElement('div');
			card.className = 'card';
      		// focusが指定されていれば使い、なければ center top を使う
			const focus = seeker.focus || 'center top';
			// カードタイプ：ダミーの場合ダミークラス適用
			if (seeker.type === 'dummy') {
				card.classList.add('dummy');
			}

			card.innerHTML = `
				<img src="${seeker.image}" alt="${seeker.name}" style="object-position:${focus};">
				<h2>${seeker.name}</h2>
				<p>職業：${seeker.job}<br>出身シナリオ：${seeker.scenario}</p>
			`;
			container.appendChild(card);
		});
		// 判定タイミング調整
		setTimeout(() => {
			updateActiveCard(); // 初期の中央判定
		}, 100);
	})
	.catch(error => {
		console.error('JSON読み込みエラー:', error);
	});
}

// スクロールイベント後、中央カードに .active を付与
let scrollTimeout;
window.addEventListener('scroll', () => {
	clearTimeout(scrollTimeout);
	scrollTimeout = setTimeout(updateActiveCard, 50);
});
window.addEventListener('resize', updateActiveCard);

// 中央カードに .active を付与
function updateActiveCard() {
	const container = document.getElementById('carousel');
	const cards = container.querySelectorAll('.card');
	const containerRect = container.getBoundingClientRect();

	let closestCard = null;
	let minDistance = Infinity;

	cards.forEach(card => {
		if (card.classList.contains('dummy')) return;
		const cardRect = card.getBoundingClientRect();
		const cardCenter = cardRect.left + cardRect.width / 2;
		const containerCenter = containerRect.left + containerRect.width / 2;
		const distance = Math.abs(containerCenter - cardCenter);
		if (distance < minDistance) {
			minDistance = distance;
			closestCard = card;
		}
	});

	cards.forEach(card => {
		card.classList.remove('active');
	});
	if (closestCard) {
		closestCard.classList.add('active');
	}
}

//左右カードタップでスクロール
document.getElementById('carousel').addEventListener('click', e => {
	const card = e.target.closest('.card');
	if (!card) return;
	if (card.classList.contains('dummy')) return;
	if (card.classList.contains('active')) return;

	const container = document.getElementById('carousel');
	const containerRect = container.getBoundingClientRect();
	const cardRect = card.getBoundingClientRect();
	const cardCenter = cardRect.left + cardRect.width / 2;
	const containerCenter = containerRect.left + containerRect.width / 2;

	const direction = cardCenter < containerCenter ? -1 : 1;

	// gapの取得（px単位）
	const style = getComputedStyle(container);
	const gap = parseFloat(style.gap) || 0;
	// gapを含めたスクロール量
	const scrollAmount = cardRect.width + gap;

	container.scrollBy({
		left: direction * scrollAmount,
		behavior: 'smooth'
	});
	setTimeout(() => {
		updateActiveCard();
	}, 100);
});
