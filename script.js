// 探索者カード生成
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
				<p>職業：${seeker.job}<br>通過シナリオ：${seeker.scenario}</p>
			`;
			container.appendChild(card);
		});
		// 判定タイミング調整
		setTimeout(() => {
			// 0番目をダミーとして1枚目にスクロールする
			const cards = container.querySelectorAll('.card');
			const style = getComputedStyle(container);
			const gap = parseFloat(style.gap.replace('px', '')) || 0;
			const cardWidth = cards[0].offsetWidth + gap;

			const targetIndex = 1;
			container.scrollLeft = cardWidth * targetIndex;
			//スクロールするからいらない？ updateActiveCard(); // 初期の中央判定
		}, 100);
	})
	.catch(error => {
		console.error('JSON読み込みエラー:', error);
	});

// スクロールイベント後、中央カードに .active を付与
let scrollTimeout;
window.addEventListener('scroll', () => {
	clearTimeout(scrollTimeout);
	scrollTimeout = setTimeout(updateActiveCard, 50);
});
window.addEventListener('resize', updateActiveCard);

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
});
