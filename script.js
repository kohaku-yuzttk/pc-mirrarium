// グローバル要素定義
let allSeekers = [];
let skillMaster = [];
let allSkills = [];
let scrollTimeout;
let isDown = false;
let startX;
let scrollLeft;
const isPointerDevice = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// イベント定義
// 前の画面に戻る
window.addEventListener('popstate', event => {
  const screenId = event.state?.screen || 'home';
  showScreen(screenId);
});
// 戻るボタン押下時、前画面に戻る
document.querySelectorAll('.back-button').forEach(btn => {
  btn.addEventListener('click', () => {
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
// バックホームボタンクリックでホーム画面へ
document.getElementById('back-home').addEventListener('click', () => {
  showScreen('home'); // 画面切り替え
});

// 画面読み込み時、スクロールイベント定義
document.addEventListener('DOMContentLoaded', () => {
  const carousel = document.getElementById('carousel');
	
  // スクロールイベント後、アクティブカード更新
  carousel.addEventListener('scroll', () => {
  	clearTimeout(scrollTimeout);
  	scrollTimeout = setTimeout(updateActiveCard, 50);
  });
	
	// クリックで中央寄せ
    carousel.addEventListener('click', e => {
      const card = e.target.closest('.card');
      if (!card || card.classList.contains('dummy') || card.classList.contains('active')) return;

      document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      scrollToActiveCard();
    });
	
  // PCのみ
  if (isPointerDevice) {
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
	
  if (skill === 'non' && val === 'non') {
    filtered = sortSeekers(allSeekers, 'yomi', 'asc');
  } else {
    const threshold = {
      '30up': 30,
      '50up': 50,
      '75up': 75,
      '90up': 90,
	  'non': 1
    }[val];
	filtered = filterSeekersBySkill(allSeekers, skill, threshold);
  }
  showSearchResults(filtered, skill);
});
// 🏷️ タグから探す 検索ボタンクリックイベント
document.getElementById('search-button-by-tag').addEventListener('click', () => {
  const tag = document.getElementById('search-tag').value;
  let filtered;
  if (tag === 'non') {
    filtered = sortSeekers(allSeekers, 'yomi', 'asc');
  } else if (tag === 'なし') {
	filtered = allSeekers.filter(seeker =>
  	　　!(Array.isArray(seeker.tag_list) && seeker.tag_list.length > 0)
	);
  } else {
    filtered = allSeekers.filter(seeker =>
      (seeker.tag_list || []).includes(tag)
    );
  }
  showSearchResults(filtered, 'tag');
});
// 📄 参加シナリオから探す　検索ボタンクリックイベント
document.getElementById('search-button-by-HO').addEventListener('click', () => {
  const hoKeyword = document.getElementById('search-HO').value.trim();
  let filtered;
  if (!hoKeyword) {
    // 🔍 デフォルト表示（名前順）
    filtered = sortSeekers(allSeekers, 'yomi', 'asc');
  } else {
  	filtered = filterSeekersByHO(allSeekers, hoKeyword);
  }
  showSearchResults(filtered, 'HO', 'asc');
});
// 📄 HOから探す　検索ボタンクリックイベント
document.getElementById('search-button-by-scenario').addEventListener('click', () => {
  const scenarioKeyword = document.getElementById('search-scenario').value.trim();
  let filtered;
  if (!scenarioKeyword) {
    // 🔍 デフォルト表示（名前順）
    filtered = sortSeekers(allSeekers, 'yomi', 'asc');
  } else {
  	filtered = filterSeekersByscenario(allSeekers, scenarioKeyword);
  }
  showSearchResults(filtered, 'scenario', 'asc');
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
      seeker.name.includes(keyword) || (seeker.yomi || '').includes(keyword)
    );
  }
  showSearchResults(filtered, 'name');
});

// ファンクション定義
// 画面呼び出し
function showScreen(id) {
  document.querySelectorAll('section').forEach(sec => {
    sec.style.display = 'none';
  });
  document.getElementById(id).style.display = 'block';
	// 履歴に追加
  history.pushState({ screen: id }, '', `#${id}`);
  // 画面トップへスクロール
  window.scrollTo({
  top: 0,
  behavior: 'smooth'
  });
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
  const response = await fetch("https://script.google.com/macros/s/AKfycbwUfJSba6KMV8bp27GsCD113P5FZNYYH9oSYXVpc8GyX4khWI-c8XjxIMkhrwgcLXfp/exec?mode=data");
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
  	if (typeof seeker.color_list === 'string') {
    	try {
      	seeker.color_list = JSON.parse(seeker.color_list);
    	} catch (e) {
      	console.warn(`カラーリストのパースに失敗しました（${seeker.name}）`, e);
      	seeker.color_list = [];
    	}
  	}
  	if (typeof seeker.skill_list === 'string') {
    	try {
      	seeker.skill_list = JSON.parse(seeker.skill_list);
    	} catch (e) {
      	console.warn(`技能リストのパースに失敗しました（${seeker.name}）`, e);
      	seeker.color_list = [];
    	}
  	}
  	if (typeof seeker.relation_list === 'string') {
    	try {
      	seeker.relation_list = JSON.parse(seeker.relation_list);
    	} catch (e) {
      	console.warn(`関係値リストのパースに失敗しました（${seeker.name}）`, e);
      	seeker.relation_list = [];
    	}
  	}
    	if (typeof seeker.voice_list === 'string') {
    	try {
      	seeker.voice_list = JSON.parse(seeker.voice_list);
    	} catch (e) {
      	console.warn(`ボイスリストのパースに失敗しました（${seeker.name}）`, e);
      	seeker.voice_list = [];
    	}
  	}
	});

  return data;
}
// 全技能情報読み込み
async function loadSkillMasterData() {
  const response = await fetch("https://script.google.com/macros/s/AKfycbwUfJSba6KMV8bp27GsCD113P5FZNYYH9oSYXVpc8GyX4khWI-c8XjxIMkhrwgcLXfp/exec?mode=skill_master");
  const data = await response.json();
  skillMaster = data;
  console.log(skillMaster); // データ確認用

  return skillMaster;
}
// カルーセル初期化
async function initCarousel() {
  loadSeekerData_local(); // ローカルデータ表示
  showLoading(); // ロード画面表示
  loadSkillMasterData();  // 技能マスタ読み込み
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
  // ✅ 全探索者の技能からオプションを生成
  allSeekers = seekers;
  allSkills = extractAllSkills(seekers);
  populateSkillOptions(allSkills);
  console.log(allSkills);

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
  document.getElementById('pl').textContent = seeker.pl || '―';
  document.getElementById('birthday').textContent = formatBirthday(seeker.birthday);
  // タグ
  const tags = document.getElementById('tags');
  const tagList = Array.isArray(seeker.tag_list) ? seeker.tag_list : [];
  tags.innerHTML = tagList.map(tag => `<span class="tag">${tag}</span>`).join('');

  // 立ち絵
  const portrait = document.getElementById('portrait');
  portrait.src = seeker.image || 'images/726522_s.jpg';
  // 🔍 フォーカス値によるトリミング位置調整
  const focus = seeker.focus?.trim();
  portrait.style.objectPosition = focus ? focus : 'center top';

  // キャラシートURL
  const sheetLink = document.querySelector('#sheet-url a');
  if (seeker.ia_url || seeker.bl_url) {
    sheetLink.href = seeker.ia_url || seeker.bl_url;
    sheetLink.style.display = 'inline';
  } else {
  	sheetLink.style.display = 'none';
  }
  // 使用メーカー
  const imageMaker = document.getElementById('image_maker');
  if (seeker.image_maker && seeker.image_maker !== '') {
    imageMaker.innerHTML = `<span style="border-bottom: 1px dashed #999;">使用メーカー</span>
      <br>　${seeker.image_maker}`;
  } else {
    imageMaker.style.display = 'none';
  }

  // 能力値
  document.getElementById('HP').textContent = seeker.HP || '―';
  document.getElementById('MP').textContent = seeker.MP || '―';
  document.getElementById('DB').textContent = seeker.DB || '―';
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

  // カラータグ生成
	const colors = Array.isArray(seeker.color_list) ? seeker.color_list : [];
	const colortags = document.getElementById('color-tags');
	const colortag = document.getElementById('color-tag');

	if (colortag) colortag.innerHTML = '';
	if (colors.length > 0 && colortag) {
		colors.forEach(code => {
  			const span = document.createElement('span');
  			span.className = 'color-tag';
  			span.style.backgroundColor = code;
			span.style.color = getTextColor(code);
  			span.dataset.color = code;
  			span.textContent = code;
  			// クリックでコードをコピー
  			span.addEventListener('click', () => {
    			navigator.clipboard.writeText(code).then(() => {
      			span.textContent = 'コピーしました';
      			setTimeout(() => span.textContent = code, 1500);
    			}).catch(err => {
      			console.error('コピーに失敗しました:', err);
    			});
  			});
  			colortag.appendChild(span);
		});
	};
	// カラータグがあるときのみ表示
	if (colortags) {
	  colortags.style.display = colors.length > 0 ? 'block' : 'none';
	}

	// 技能テーブル生成
	const skills = Array.isArray(seeker.skill_list) ? seeker.skill_list : [];
	const skillList = document.getElementById('skill-list');
	skillList.innerHTML = ''; // 初期化  

	if (skills.length > 0) {
  		const table = document.createElement('table');
  		table.className = 'skill-table-inner';

      // ソートキー順に並べ替え
      skills.sort((a, b) => a.sortKey - b.sortKey);

  		skills.forEach(skill => {
    		const row = document.createElement('tr');
    		const nameCell = document.createElement('td');
    		nameCell.textContent = skill.skill_text;
    		nameCell.className = 'skill-name';

    		const valueCell = document.createElement('td');
    		valueCell.textContent = skill.skill_val;
    		valueCell.className = 'skill-value';

    		row.appendChild(nameCell);
    		row.appendChild(valueCell);
    		table.appendChild(row);
  		});
  	skillList.appendChild(table);
	}

	// ボイス情報
	createVoiceInfo(seeker);
	// リレイション情報
	createlationshipBlock(seeker);
}

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
    { key: 'SAN_now', label: 'SAN' }
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
    DB: 'DB',
	  age: '年齢',
	  SAN_ini: '初期SAN',
  };
  if (Key in labelMap) {
  	columns.push({ key: Key, label: labelMap[Key] });
  } else if (Array.isArray(allSkills) && allSkills.some(skill => skill.skill_text === Key)) {
  columns.push({ key: Key, label: Key });
  } else if (Key === 'HO') {
	columns.push({ key: 'scenario_list', label: '参加シナリオ' });
  } else if (Key === 'scenario') {
	columns.push({ key: 'scenario_list', label: '参加シナリオ' });
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
      } else if (col.key === 'HP') {
        td.textContent = seeker.HP ?? '―';
  	  } else if (col.key === 'MP') {
        td.textContent = seeker.MP ?? '―';
  	  } else if (col.key === 'DB') {
        td.textContent = seeker.DB ?? '―';
  	  } else if (col.key === 'tag_list') {
    	  const tags = Array.isArray(seeker.tag_list) ? seeker.tag_list : [];
		    tags.sort();
    	  td.innerHTML = tags.length > 0
		    ? tags.map(tag => `<span class="tag">${tag}</span>`).join(' ')
		    : '<span class="tag tag-empty">―</span>';
  	  } else if (Key in labelMap) {
    	  td.textContent = seeker[col.key] ?? '―';
  	  } else if (col.key === 'HO') {
  		  td.textContent = seeker.HO ?? '―';
	    } else if (col.key === 'scenario_list') {
  		  const scenarios = Array.isArray(seeker.scenario_list) ? seeker.scenario_list : [];
  		  td.innerHTML = scenarios.length > 0
    	  ? scenarios.map(s => {
        	const title = s.title ?? '（タイトル不明）';
        	const ho = s.HO ?? '―';
        	return `<div class="scenario-entry"><span class="scenario-title">${title}</span> <span class="scenario-ho">[${ho}]</span></div>`;
     	  }).join('')
    	  : '<span class="scenario-empty">―</span>';
	    } else {
		    const skills = Array.isArray(seeker.skill_list) ? seeker.skill_list : [];
        const skillMatch = skills.find(skill => skill.skill_text === col.key);
        td.textContent = skillMatch?.skill_val ?? '―';
	    }
      row.appendChild(td);
    });
    row.addEventListener('click', () => {
      showSeekerDetail(seeker);
    });
    body.appendChild(row);
  });
}

// 全技能読み込み
function extractAllSkills(seekers) {
  const skillMap = new Map();

  seekers.forEach(seeker => {
    const skills = Array.isArray(seeker.skill_list) ? seeker.skill_list : [];
    skills.forEach(skill => {
      const text = skill.skill_text?.trim();
      if (!text || skillMap.has(text)) return;

      skillMap.set(text, {
        skill_text: text,
        group: skill.group || "未分類",
        sortKey: typeof skill.sortKey === "number" ? skill.sortKey : parseInt(skill.sortKey, 10) || 9999
      });
    });
  });
  return Array.from(skillMap.values()).sort((a, b) => a.sortKey - b.sortKey);
}
// 技能オプション更新
function populateSkillOptions(allSkills) {
  const select = document.getElementById("search-skill");
  const skills = allSkills;

  skills.forEach(text => {
    const option = document.createElement("option");
    option.value = text.skill_text;
    option.textContent = text.skill_text;
    select.appendChild(option);
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
// DB期待値計算
function parseDB(dbString) {
  if (dbString === "±0") return 0;
  const match = dbString.match(/([+-])(\d+)D(\d+)/);
  if (!match) return 0;
  const sign = match[1] === "+" ? 1 : -1;
  const diceCount = parseInt(match[2], 10);
  const diceType = parseInt(match[3], 10);
  const expected = diceCount * (diceType + 1) / 2;
  return sign * expected;
}
// ソート
function sortSeekers(seekers, key = 'yomi', order = 'asc') {
  const sorted = [...seekers];
  sorted.sort((a, b) => {
    let valA, valB;
	  
    // 🔍 読み仮名ソート（50音順）
    if (key === 'yomi') {
      valA = a.yomi ?? a.name ?? '';
      valB = b.yomi ?? b.name ?? '';
      const result = valA.localeCompare(valB, 'ja');
      return order === 'asc' ? result : -result;
    }
    // 🎲 DBソート（期待値ベース）
    if (key === 'DB') {
      valA = parseDB(a.DB);
      valB = parseDB(b.DB);
      return order === 'asc' ? valA - valB : valB - valA;
    }
    // 🔢 数値ソート（年齢、STRなど）
    valA = a[key] ?? 0;
    valB = b[key] ?? 0;
    return order === 'asc' ? valA - valB : valB - valA;
  });
  return sorted;
}
// 技能フィルタ
function filterSeekersBySkill(seekers, skillName, threshold = 0) {
  const filtered = seekers.filter(seeker => {
    const skills = Array.isArray(seeker.skill_list) ? seeker.skill_list : [];
    const match = skills.find(skill => skill.skill_text === skillName);
    return match && (match.skill_val ?? 0) >= threshold;
  });
  // 降順ソート
  return filtered.sort((a, b) => {
    const aSkill = a.skill_list?.find(s => s.skill_text === skillName)?.skill_val ?? 0;
    const bSkill = b.skill_list?.find(s => s.skill_text === skillName)?.skill_val ?? 0;
    return bSkill - aSkill;
  });
}
// シナリオフィルタ
function filterSeekersByscenario(seekers, keyword) {
  if (!keyword || keyword === 'non') return seekers;

  return seekers.filter(seeker => {
    const currentscenario = seeker.scenario ?? '';
    const scenarios = Array.isArray(seeker.scenario_list)
      ? seeker.scenario_list.map(s => s.scenario ?? '')
      : [];

    // すべてのHOを結合して部分一致判定
    const allscenarios = [currentscenario, ...scenarios];
    return allscenarios.some(scenario => scenario.includes(keyword));
  });
}
// HOフィルタ
function filterSeekersByHO(seekers, keyword) {
  if (!keyword || keyword === 'non') return seekers;

  return seekers.filter(seeker => {
    const currentHO = seeker.HO ?? '';
    const scenarioHOs = Array.isArray(seeker.scenario_list)
      ? seeker.scenario_list.map(s => s.HO ?? '')
      : [];

    // すべてのHOを結合して部分一致判定
    const allHOs = [currentHO, ...scenarioHOs];
    return allHOs.some(ho => ho.includes(keyword));
  });
}
// 誕生日書式変換
function formatBirthday(dateStr) {
  if (!dateStr) return '不明';

  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr; // 想定外の形式ならそのまま返す

  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  return `${month}月${day}日`;
}
// 背景色から文字色判定
function getTextColor(bgColor) {
  const r = parseInt(bgColor.slice(1, 3), 16);
  const g = parseInt(bgColor.slice(3, 5), 16);
  const b = parseInt(bgColor.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? '#000' : '#fff';
}
// ボイス情報生成
function createVoiceInfo(data) {
  const voiceBlock = document.querySelector(".voice-info");
  if (!voiceBlock) return;

  const values = [data.voice_h, data.voice_s, data.voice_p, data.voice_w, data.voice_e];
  const hasInput = values.some(val => val !== "" && val !== null && val !== undefined);

  if (hasInput) {
    voiceBlock.classList.remove("hidden");
    document.getElementById("voice-h").value = data.voice_h;
    document.getElementById("voice-s").value = data.voice_s;
    document.getElementById("voice-p").value = data.voice_p;
    document.getElementById("voice-w").value = data.voice_w;
    document.getElementById("voice-e").value = data.voice_e;

    const buttonContainer = document.getElementById('voice-line');
    const voicePlayer = document.getElementById('voice-player');

    let currentBtn = null;
    buttonContainer.innerHTML = "";

    if (Array.isArray(data.voice_list) && data.voice_list.length > 0) {
      data.voice_list.forEach(sample => {
        const entry = document.createElement("div");
        entry.className = "voice-entry";

        // 🔹 テキスト表示（スクロール対応）
        const textWrapper = document.createElement("div");
        textWrapper.className = "voice-text";

        const scrollText = document.createElement("div");
        scrollText.className = "voice-scroll";
        scrollText.textContent = sample.text;
        scrollText.title = sample.text;

        textWrapper.appendChild(scrollText);
        entry.appendChild(textWrapper);

        // 🔊 再生ボタン
        const btn = document.createElement("button");
        btn.className = "voice-play";
        btn.setAttribute("data-src", sample.path);
        btn.textContent = "▶";
        entry.appendChild(btn);

        buttonContainer.appendChild(entry);

        // 🎧 再生制御
        btn.addEventListener("click", () => {
          const src = btn.getAttribute("data-src");

          if (btn === currentBtn) {
            voicePlayer.pause();
            voicePlayer.currentTime = 0;
            btn.classList.remove("playing");
            btn.textContent = "▶";
            currentBtn = null;
            return;
          }

          if (currentBtn) {
            currentBtn.classList.remove("playing");
            currentBtn.textContent = "▶";
          }

          voicePlayer.src = src;
          voicePlayer.play();
          btn.classList.add("playing");
          btn.textContent = "⏹";
          currentBtn = btn;
        });

        // 📜 スクロール判定（内側要素に対して）
        setTimeout(() => {
          if (scrollText.scrollWidth > textWrapper.clientWidth) {
            scrollText.classList.add("scroll");
          }
        }, 0);
      });

      voicePlayer.addEventListener("ended", () => {
        if (currentBtn) {
          currentBtn.classList.remove("playing");
          currentBtn.textContent = "▶";
          currentBtn = null;
        }
      });
    } else {
      buttonContainer.innerHTML = "　なし";
    }
  } else {
    voiceBlock.classList.add("hidden");
  }
}
// リレイション情報生成
function createlationshipBlock(data) {
  const block = document.querySelector(".relationship-block");
  const list = Array.isArray(data.relation_list) ? data.relation_list : [];

  if (list.length === 0) {
    block.style.display = "none";
    return;
  }

  block.style.display = "block";
  const container = block.querySelector(".relationship-list");
  container.innerHTML = "";

  list.forEach(rel => {
    const card = document.createElement("div");
    card.className = "relationship-card";
    card.innerHTML = `
      <span class="relation-type">${rel.type}</span>
      <span class="relation-name">${rel.name}</span>
    `;
    container.appendChild(card);
  });
}
