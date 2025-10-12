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
