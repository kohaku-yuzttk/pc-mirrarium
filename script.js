// グローバル要素定義
let allSeekers = [];
let scrollTimeout;
let isDown = false;
let startX;
let scrollLeft;
const isPointerDevice = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// 画面呼び出し
function showScreen(id) {
  document.querySelectorAll('section').forEach(sec => {
    sec.style.display = 'none';
  });
  document.getElementById(id).style.display = 'block';
	// 履歴に追加
  history.pushState({ screen: id }, '', `#${id}`);
}
// 前の画面に戻る
window.addEventListener('popstate', event => {
  const screenId = event.state?.screen || 'home';
  showScreen(screenId);
});
// 戻るボタン押下時、前画面に戻る
document.querySelectorAll('.back-button').forEach(btn => {
  btn.addEventListener('click', () => {
	  console.log(history.length);
	if (history.length > 1) {
		history.back();
	} else {
  		showScreen('home');
	}
  });
});
// ヘッダクリックでホーム画面へ
document.getElementById('header-title').addEventListener('click', () => {
  showScreen('home'); // 画面切り替え
});
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
  allSeekers = data;
  console.log(data); // データ確認用
	
	// 配列形式に変換
	allSeekers.forEach(seeker => {
	if (seeker.type === 'dummy') return;
  	if (typeof seeker.tag_list === 'string') {
    	try {
      	seeker.tag_list = JSON.parse(seeker.tag_list);
    	} catch (e) {
      	console.warn(`タグのパースに失敗しました（${seeker.name}）`, e);
      	seeker.tag_list = [];
    	}
  	}
  	if (typeof seeker.scenario_list === 'string') {
    	try {
      	seeker.scenario_list = JSON.parse(seeker.scenario_list);
    	} catch (e) {
      	console.warn(`シナリオリストのパースに失敗しました（${seeker.name}）`, e);
      	seeker.scenario_list = [];
    	}
  	}
	});

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
	scrollToActiveCard(); // 初期中央寄せ
  }, 100);
  hideLoading(); // ロード画面非表示
  // 履歴に追加
  history.replaceState({ screen: 'home' }, '', '#home');
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


// 画面読み込み時、スクロールイベント定義
document.addEventListener('DOMContentLoaded', () => {
  const carousel = document.getElementById('carousel');
	
  // スクロールイベント後、アクティブカード更新
  carousel.addEventListener('scroll', () => {
  	clearTimeout(scrollTimeout);
  	scrollTimeout = setTimeout(updateActiveCard, 50);
  });

  // PCのみ：クリックで中央寄せ
  if (isPointerDevice) {
    carousel.addEventListener('click', e => {
      const card = e.target.closest('.card');
      if (!card || card.classList.contains('dummy') || card.classList.contains('active')) return;

      document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      scrollToActiveCard();
    });

    // ドラッグスクロール
    carousel.addEventListener('mousedown', e => {
      isDown = true;
      carousel.classList.add('dragging');
      startX = e.pageX - carousel.offsetLeft;
      scrollLeft = carousel.scrollLeft;
    });
    carousel.addEventListener('mouseleave', () => {
      isDown = false;
      carousel.classList.remove('dragging');
    });
    carousel.addEventListener('mouseup', () => {
      isDown = false;
      carousel.classList.remove('dragging');
    });
    carousel.addEventListener('mousemove', e => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - carousel.offsetLeft;
      const walk = (x - startX) * 1.5;
      carousel.scrollLeft = scrollLeft - walk;
    });
  }
});
// 画面リサイズ時、アクティブカード更新
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

  cards.forEach(card => card.classList.remove('active'));
  if (closestCard) closestCard.classList.add('active');
}

// アクティブカードを中央にスクロール
function scrollToActiveCard() {
  const activeCard = document.querySelector('.card.active');
  if (!activeCard) return;

  activeCard.scrollIntoView({
    behavior: 'smooth',
    inline: 'center',
    block: 'nearest'
  });
}

// 探索者データ照会画面表示
function showSeekerDetail(seeker) {
  showScreen('detail');

  // 基本情報
  const nameElem = document.getElementById('name');
  if (seeker.yomi) {
    nameElem.innerHTML = `<ruby>${seeker.name}<rt>${seeker.yomi}</rt></ruby>`;
  } else {
    nameElem.textContent = seeker.name;
  }
  document.getElementById('occupation').textContent = seeker.job || '―';
  document.getElementById('age').textContent = seeker.age || '―';
  document.getElementById('scenario').textContent = seeker.scenario || '―';
  // タグ
  const tags = document.getElementById('tags');
  const tagList = Array.isArray(seeker.tag_list) ? seeker.tag_list : [];
  tags.innerHTML = tagList.map(tag => `<span class="tag">${tag}</span>`).join('');

  // 画像とキャラシートURL
  document.getElementById('portrait').src = seeker.image || 'images/726522_s.jpg';
  const sheetLink = document.querySelector('#sheet-url a');
  if (seeker.ia_url || seeker.bl_url) {
    sheetLink.href = seeker.ia_url || seeker.bl_url;
    sheetLink.style.display = 'inline';
  } else {
  	sheetLink.style.display = 'none';
  }

  // 能力値
  document.getElementById('HP').textContent = seeker.HP || '―';
  document.getElementById('MP').textContent = seeker.MP || '―';
  document.getElementById('SAN_now').textContent = seeker.SAN_now || '―';
  document.getElementById('SAN_ini').textContent = seeker.SAN_ini || '―';  
  const statusList = document.getElementById('status-list');
  statusList.innerHTML = `
    <li class="str">STR: ${seeker.STR ?? '―'}</li>
    <li class="app">APP: ${seeker.APP ?? '―'}</li>
    <li class="con">CON: ${seeker.CON ?? '―'}</li>
    <li class="siz">SIZ: ${seeker.SIZ ?? '―'}</li>
    <li class="pow">POW: ${seeker.POW ?? '―'}</li>
    <li class="int">INT: ${seeker.INT ?? '―'}</li>
    <li class="dex">DEX: ${seeker.DEX ?? '―'}</li>
    <li class="edu">EDU: ${seeker.EDU ?? '―'}</li>
  `;
	
  // タイムライン生成
	const timeline = document.getElementById('scenario-timeline');
	const list = Array.isArray(seeker.scenario_list) ? seeker.scenario_list : [];
	list.sort((a, b) => new Date(a.date) - new Date(b.date));

	timeline.innerHTML = list.map(s => `
  		<li class="timeline-item">
    		<div class="timeline-date">${s.date}</div>
    		<div class="timeline-content">
      		<strong>${s.title}</strong>${s.HO ? `（${s.HO}）` : ''}
    		</div>
  		</li>
	`).join('');
}

// 📝 一覧から探す 検索ボタンクリックイベント
document.getElementById('search-button').addEventListener('click', () => {
  const type = document.getElementById('sort-type').value;
  const order = document.getElementById('sort-order').value;

  const sorted = sortSeekers(allSeekers, type, order);
  showSearchResults(sorted, type);
});
// 🎲 技能から探す 検索ボタンクリックイベント
document.getElementById('search-button-by-skill').addEventListener('click', () => {
  const skill = document.getElementById('search-skill').value;
  const val = document.getElementById('search-val').value;
  let filtered;
  if (skill === 'non' || val === 'non') {
    filtered = sortSeekers(allSeekers, 'yomi', 'asc');
  } else {
    const threshold = {
      '30up': 30,
      '50up': 50,
      '75up': 75,
      '90up': 90
    }[val];
    filtered = allSeekers.filter(seeker => (seeker[skill] ?? 0) >= threshold);
  }
  showSearchResults(filtered, skill);
});
// 🏷 タグから探す 検索ボタンクリックイベント
document.getElementById('search-button-by-tag').addEventListener('click', () => {
  const tag = document.getElementById('search-tag').value;
  let filtered;
  if (!tag) {
    filtered = sortSeekers(allSeekers, 'yomi', 'asc');
  } else {
    filtered = allSeekers.filter(seeker =>
      (seeker.tag_list || []).includes(tag)
    );
  }
  showSearchResults(filtered, 'tag');
});
// 👤 名前で探す 検索ボタンクリックイベント
document.getElementById('search-button-by-name').addEventListener('click', () => {
  const keyword = document.getElementById('search-name').value.trim();
  let filtered;
  if (!keyword) {
    // 🔍 デフォルト表示（名前順）
    filtered = sortSeekers(allSeekers, 'yomi', 'asc');
  } else {
    filtered = allSeekers.filter(seeker =>
      seeker.name.includes(keyword) || (seeker.kana || '').includes(keyword)
    );
  }
  showSearchResults(filtered, 'name');
});

// 検索結果一覧画面表示
function showSearchResults(seekers, Key = 'yomi', order = 'asc') {
  showScreen('search');

  const header = document.getElementById('search-header');
  const body = document.getElementById('search-results');
  header.innerHTML = '';
  body.innerHTML = '';

  // デフォルト表示項目
  let columns = [
    { key: 'image', label: '画像' },
    { key: 'name', label: '名前' },
    { key: 'tag_list', label: 'タグ' },
    { key: 'HP', label: 'HP' },
    { key: 'MP', label: 'MP' },
    { key: 'SAN_now', label: '現在SAN' },
    { key: 'SAN_ini', label: '初期SAN' }
  ];

  // ✅ 条件に応じて表示項目追加
  const labelMap = {
  	STR: 'STR',
  	CON: 'CON',
  	POW: 'POW',
  	DEX: 'DEX',
  	APP: 'APP',
  	SIZ: 'SIZ',
  	INT: 'INT',
  	EDU: 'EDU',
  	idea: 'アイデア',
  	luck: '幸運',
  	know: '知識'
  };
  if (Key in labelMap) {
  	columns.push({ key: Key, label: labelMap[Key] });
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
	  if (seeker.type === 'dummy') return; // ダミーなら何もせず次へ

      const td = document.createElement('td');
      if (col.key === 'image') {
        td.innerHTML = `<img src="${seeker.image}" alt="${seeker.name}" class="thumb">`;
      } else if (col.key === 'name') {
  		td.innerHTML = seeker.yomi
    	  ? `<ruby>${seeker.name}<rt>${seeker.yomi}</rt></ruby>`
    	  : seeker.name;
      } else if (col.key === 'SAN_now') {
        td.textContent = seeker.SAN_now ?? '―';
      } else if (col.key === 'SAN_ini') {
        td.textContent = seeker.SAN_ini ?? '―';
  	  } else if (col.key === 'tag_list') {
    	const tags = Array.isArray(seeker.tag_list) ? seeker.tag_list : [];
		tags.sort();
    	td.innerHTML = tags.length > 0
		  ? tags.map(tag => `<span class="tag">${tag}</span>`).join(' ')
		  : '<span class="tag tag-empty">―</span>';
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
function sortSeekers(seekers, key = 'kana', order = 'asc') {
  const sorted = [...seekers];
  sorted.sort((a, b) => {
    const valA = a[key] ?? 0;
    const valB = b[key] ?? 0;
    return order === 'asc' ? valA - valB : valB - valA;
  });
  return sorted;
}
