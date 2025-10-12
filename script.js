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

			card.innerHTML = `
				<img src="${seeker.image}" alt="${seeker.name}" style="object-position:${focus};">
				<h2>${seeker.name}</h2>
				<p>職業：${seeker.job}<br>通過シナリオ：${seeker.scenario}</p>
			`;
			container.appendChild(card);
		});
		// 最初と最後のカードを複製して前後に追加
		const cards = container.querySelectorAll('.card');
		const firstClone = cards[0].cloneNode(true);
		const lastClone = cards[cards.length - 1].cloneNode(true);
		container.insertBefore(lastClone, cards[0]);
		container.appendChild(firstClone);

		// 初期位置を2枚目（本来の最初）にスクロール
		setTimeout(() => {
			const cardWidth = cards[0].offsetWidth + 32; // gap分も加味
			container.scrollLeft = cardWidth;
			updateActiveCard(); // 初期の中央判定
		}, 100);
	})
	.catch(error => {
		console.error('JSON読み込みエラー:', error);
	});

// 中央カードに .active を付与
window.addEventListener('scroll', updateActiveCard);
window.addEventListener('resize', updateActiveCard);

function updateActiveCard() {
	const container = document.getElementById('carousel');
	const cards = container.querySelectorAll('.card');
	const containerRect = container.getBoundingClientRect();

	cards.forEach(card => {
		const cardRect = card.getBoundingClientRect();
		const cardCenter = cardRect.left + cardRect.width / 2;
		const containerCenter = containerRect.left + containerRect.width / 2;
		const distance = Math.abs(containerCenter - cardCenter);

		if (distance < cardRect.width / 2) {
			card.classList.add('active');
		} else {
			card.classList.remove('active');
		}
	});
}

//左右カードタップでスクロール
document.getElementById('carousel').addEventListener('click', e => {
	const card = e.target.closest('.card');
	if (!card) return;

	const container = document.getElementById('carousel');
	const containerRect = container.getBoundingClientRect();
	const cardRect = card.getBoundingClientRect();
	const cardCenter = cardRect.left + cardRect.width / 2;
	const containerCenter = containerRect.left + containerRect.width / 2;

	const direction = cardCenter < containerCenter ? -1 : 1;
	container.scrollBy({
		left: direction * cardRect.width,
		behavior: 'smooth'
	});
	updateActiveCard();
});

//端に来たら中央に戻す
document.getElementById('carousel').addEventListener('scroll', () => {
	const container = document.getElementById('carousel');
	const cards = container.querySelectorAll('.card');
	const cardWidth = cards[0].offsetWidth + 32; // gap分

	const scrollLeft = container.scrollLeft;
	const maxScroll = container.scrollWidth - container.clientWidth;

	// 左端に来たら最後のカードの手前にジャンプ
	if (scrollLeft < cardWidth / 2) {
		container.scrollLeft = cardWidth * (cards.length - 2);
	}

	// 右端に来たら最初のカードの次にジャンプ
	if (scrollLeft > maxScroll - cardWidth / 2) {
		container.scrollLeft = cardWidth;
	}

	updateActiveCard(); // 中央判定を更新
});
