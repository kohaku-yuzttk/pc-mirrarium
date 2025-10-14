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
  loadSeekerData_local(); // ローカルデータ表示
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
    // 詳細画面表示イベント
    card.addEventListener('click', () => {
      if (card.classList.contains('active')) {
        showSeekerDetail(seeker);
      }
    });
  carousel.appendChild(card);
  });
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

// 探索者データ照会画面表示
function showSeekerDetail(seeker) {
  showScreen('detail'); // 他の画面を非表示にして詳細画面を表示

  // 基本情報
  document.getElementById('name').textContent = seeker.name;
  document.getElementById('occupation').textContent = seeker.job || '―';
  document.getElementById('scenario').textContent = seeker.scenario || '―';

  // 画像とキャラシートURL（あれば）
  document.getElementById('portrait').src = seeker.image || 'images/726522_s.jpg';
  document.querySelector('#sheet-url a').href = seeker.ia_url || seeker.bl_url || '#';

  // 能力値
  const statusList = document.getElementById('status-list');
  statusList.innerHTML = `
    <li>STR: ${seeker.STR ?? '―'}</li>
    <li>CON: ${seeker.CON ?? '―'}</li>
    <li>POW: ${seeker.POW ?? '―'}</li>
    <li>DEX: ${seeker.DEX ?? '―'}</li>
    <li>APP: ${seeker.APP ?? '―'}</li>
    <li>SIZ: ${seeker.SIZ ?? '―'}</li>
    <li>INT: ${seeker.INT ?? '―'}</li>
    <li>EDU: ${seeker.EDU ?? '―'}</li>
	<p>HP: ${seeker.HP}  /  MP: ${seeker.MP}  /  SAN: ${seeker.SAN_now} / ${seeker.SAN_ini}</p>
  `;

  // タグ
  const tags = document.getElementById('tags');
  tags.innerHTML = (seeker.tag_list || []).map(tag => `<span class="tag">${tag}</span>`).join('');

  // 通過シナリオ
  const scenarioList = document.getElementById('scenario-list');
  scenarioList.innerHTML = (seeker.scenario_list || []).map(s =>
    `<li>${s.date} - ${s.title}（${s.HO}）</li>`
  ).join('');
}

// デフォルト検索結果表示
window.addEventListener('DOMContentLoaded', () => {
  const sorted = sortSeekers(allSeekers, 'kana', 'asc');
  showSearchResults(sorted, 'kana');
});
// 検索ボタンクリックイベント
document.getElementById('search-button').addEventListener('click', () => {
  const type = document.getElementById('sort-type').value;
  const order = document.getElementById('sort-order').value;
  const skill = document.getElementById('search-skill').value;
  const skill_val = document.getElementById('search-val').value;
  const tag = document.getElementById('search-tag').value;
  const nameKeyword = document.getElementById('search-name').value.trim();

  // データ取得（すでに読み込まれていると仮定）
  const filtered = allSeekers.filter(seeker => {
    if (!nameKeyword) return true;
    return seeker.name.includes(nameKeyword) || (seeker.kana || '').includes(nameKeyword);
  });

  const sorted = sortSeekers(filtered, type, order);
  showSearchResults(sorted, type); // 表示項目は type に応じて切り替え
});
// 検索結果一覧画面表示
function showSearchResults(seekers, Key = 'yomi', order = 'asc') {
  showScreen('search');
　document.getElementById('search-area').style.display = 'block';

  const header = document.getElementById('search-header');
  const body = document.getElementById('search-results');
  header.innerHTML = '';
  body.innerHTML = '';

  // ✅ 表示項目を条件に応じて切り替え
  let columns = [
    { key: 'image', label: '画像' },
    { key: 'name', label: '名前' },
    { key: 'yomi', label: 'よみ' },
    { key: 'HP', label: 'HP' },
    { key: 'MP', label: 'MP' },
    { key: 'SAN_now', label: '現在SAN' },
    { key: 'SAN_ini', label: '初期SAN' }
  ];

  if (Key === 'STR') {
    columns.push({ key: 'STR', label: 'STR' });
  }

  // ✅ ヘッダー生成
  const headerRow = document.createElement('tr');
  columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col.label;
    headerRow.appendChild(th);
  });
  header.appendChild(headerRow);

  // ✅ データ行生成
  seekers.forEach(seeker => {
    const row = document.createElement('tr');

    columns.forEach(col => {
      const td = document.createElement('td');

      if (col.key === 'image') {
        td.innerHTML = `<img src="${seeker.image}" alt="${seeker.name}" class="thumb">`;
      } else if (col.key === 'SAN_now') {
        td.textContent = seeker.SAN_now ?? '―';
      } else if (col.key === 'SAN_ini') {
        td.textContent = seeker.SAN_ini ?? '―';
      } else {
        td.textContent = seeker[col.key] ?? '―';
      }
      row.appendChild(td);
    });
    row.addEventListener('click', () => {
      showSeekerDetail(seeker);
    });
    body.appendChild(row);
  });
}
// 絞り込み
function searchSeekers(keyword, allSeekers) {
  const lower = keyword.toLowerCase();
  return allSeekers.filter(seeker =>
    seeker.name.toLowerCase().includes(lower) ||
    (seeker.tag_list || []).some(tag => tag.toLowerCase().includes(lower))
  );
}
// ソート
function sortSeekers(seekers, Key = 'kana', order = 'asc') {
  const sorted = [...seekers];
  sorted.sort((a, b) => {
    const valA = a[key] ?? 0;
    const valB = b[key] ?? 0;
    return order === 'asc' ? valA - valB : valB - valA;
  });
  return sorted;
}
