// 探索者カード生成
fetch('pc-data.json')
	.then(response => response.json())
	.then(data => {
		const container = document.getElementById('carousel');
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
		updateActiveCard();
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

const container = document.getElementById('carousel');
const cards = Array.from(container.children);

// 最初と最後のカードを複製
const firstClone = cards[0].cloneNode(true);
const lastClone = cards[cards.length - 1].cloneNode(true);

// 前後に追加
container.insertBefore(lastClone, cards[0]);
container.appendChild(firstClone);

// スクロールが端に来たら中央に戻す
container.addEventListener('scroll', () => {
	const scrollLeft = container.scrollLeft;
	const maxScroll = container.scrollWidth - container.clientWidth;

	if (scrollLeft < 10) {
		container.scrollLeft = maxScroll / 2;
	}
	if (scrollLeft > maxScroll - 10) {
		container.scrollLeft = maxScroll / 2;
	}
});
