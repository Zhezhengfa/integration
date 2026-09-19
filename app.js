const rooms = [
  { id: 1, name: '第一自习室', floor: 1, capacity: 60, used: 42, open: true,  location: '图书馆1F东侧' },
  { id: 2, name: '第二自习室', floor: 1, capacity: 80, used: 80, open: true,  location: '图书馆1F西侧' },
  { id: 3, name: '第三自习室', floor: 2, capacity: 50, used: 30, open: true,  location: '图书馆2F北侧' },
  { id: 4, name: '研讨室A',     floor: 2, capacity: 20, used: 10, open: true,  location: '图书馆2F南侧' },
  { id: 5, name: '研讨室B',     floor: 3, capacity: 20, used: 0,  open: false, location: '图书馆3F' },
  { id: 6, name: '电子阅览室',   floor: 3, capacity: 40, used: 25, open: true,  location: '图书馆3F东侧' },
  { id: 7, name: '静音自习区',   floor: 3, capacity: 35, used: 35, open: true,  location: '图书馆3F西侧' },
  { id: 8, name: '自习大厅',     floor: 4, capacity: 100,used: 60, open: true,  location: '图书馆4F' },
  { id: 9, name: '考研专区',     floor: 4, capacity: 70, used: 70, open: true,  location: '图书馆4F北侧' },
  { id: 10,name: '临时阅览室',   floor: 5, capacity: 30, used: 12, open: false, location: '图书馆5F' }
];
let barChart = null;
let lineChart = null;
const initFloorOptions = () => {
  const floors = [...new Set(rooms.map(r => r.floor))].sort((a, b) => a - b);
  floors.forEach(f => {
    $('#filter-floor').append(`<option value="${f}">${f}楼</option>`);
  });
};
const renderRooms = () => {
  const floor = $('#filter-floor').val();
  const status = $('#filter-status').val();
  const keyword = $('#filter-keyword').val().trim().toLowerCase();
  const filtered = rooms.filter(r => {
    if (floor !== '' && r.floor !== Number(floor)) return false;
    if (status === 'open' && !r.open) return false;
    if (status === 'close' && r.open) return false;
    if (keyword) {
      const hay = (r.name + r.location).toLowerCase();
      if (!hay.includes(keyword)) return false;
    }
    return true;
  });
  $('#room-list').empty();
  if (filtered.length === 0) {
    $('#room-list').html('<div class="col-12"><div class="alert alert-info">没有符合条件的自习室</div></div>');
  } else {
    filtered.forEach(r => {
      const cls = r.open ? 'room-open' : 'room-close';
      const badge = r.open
        ? '<span class="badge bg-success">开放中</span>'
        : '<span class="badge bg-secondary">已关闭</span>';
      const pct = r.capacity > 0 ? Math.round(r.used / r.capacity * 100) : 0;
      $('#room-list').append(`
        <div class="col-md-6 col-lg-4">
          <div class="card room-card ${cls}">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <h3 class="card-title h6 mb-1">${r.name}</h3>
                ${badge}
              </div>
              <p class="card-text small text-muted mb-1">位置：${r.location}</p>
              <p class="card-text small mb-1">容量：${r.capacity}人 · 已用：${r.used}人</p>
              <div class="progress" style="height:6px;">
                <div class="progress-bar ${pct>=100?'bg-danger':pct>=70?'bg-warning':'bg-success'}" style="width:${pct}%"></div>
              </div>
            </div>
          </div>
        </div>
      `);
    });
  }
  $('#room-count').text(`共 ${filtered.length} 间`);
};
const updateStats = () => {
  const total = rooms.length;
  const open = rooms.filter(r => r.open).length;
  const usage = rooms.reduce((sum, r) => sum + r.used, 0);
  $('#stat-rooms').text(total);
  $('#stat-usage').text(usage);
  $('#stat-open').text(open);
};
const loadChart = async () => {
  $('#status').text('加载中...').show();
  try {
    const res = await fetch('data/rooms.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (data.series.length === 0) {
      $('#status').text('暂无数据').show();
      return;
    }
    $('#sub-title').text(data.title + ' · 数据来源：校园自习室模拟数据集');
    $('#status').hide();
    renderBarChart(data);
    renderLineChart(data);
  } catch (err) {
    $('#status').text('加载失败：' + err.message).show();
  }
};
const renderBarChart = (data) => {
  if (barChart === null) {
    barChart = echarts.init(document.querySelector('#bar-chart'));
  }
  barChart.setOption({
    title: { text: '各自习室本周使用量', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: data.categories, axisLabel: { interval: 0, rotate: 30 } },
    yAxis: { type: 'value', name: '人次' },
    series: [{
      name: '使用人次',
      type: 'bar',
      data: data.usage,
      itemStyle: { color: '#0d6efd' }
    }]
  });
};
const renderLineChart = (data) => {
  if (lineChart === null) {
    lineChart = echarts.init(document.querySelector('#line-chart'));
  }
  lineChart.setOption({
    title: { text: '本周使用趋势', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0 },
    xAxis: { type: 'category', data: data.days },
    yAxis: { type: 'value', name: '人次' },
    series: data.trends.map(t => ({
      name: t.name,
      type: 'line',
      data: t.values,
      smooth: true
    }))
  });
};
window.addEventListener('resize', () => {
  if (barChart) barChart.resize();
  if (lineChart) lineChart.resize();
});
$(function () {
  initFloorOptions();
  renderRooms();
  updateStats();
  loadChart();
  $('#filter-floor, #filter-status').on('change', renderRooms);
  $('#filter-keyword').on('input', renderRooms);
  $('#btn-reset').on('click', () => {
    $('#filter-floor').val('');
    $('#filter-status').val('');
    $('#filter-keyword').val('');
    renderRooms();
  });
});