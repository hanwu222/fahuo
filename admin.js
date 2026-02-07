// ==========================================
// 后台管理功能
// ==========================================

// 检查登录状态
function checkAdminLogin() {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
    if (isLoggedIn) {
        showAdminPanel();
    }
}

// 管理员登录
function adminLogin() {
    const password = document.getElementById('adminPassword').value;

    if (password === CONFIG.ADMIN_PASSWORD) {
        sessionStorage.setItem('adminLoggedIn', 'true');
        showAdminPanel();
        showToast('登录成功');
    } else {
        showToast('密码错误', 'error');
    }
}

// 管理员登出
function adminLogout() {
    sessionStorage.removeItem('adminLoggedIn');
    location.reload();
}

// 显示管理面板
function showAdminPanel() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('adminSection').style.display = 'block';
    refreshData();
}

// 刷新数据
function refreshData() {
    updateStats();
    loadOrders();
    loadFiles();
}

// 更新统计数据
function updateStats() {
    const stats = LocalStorage.getStats();
    document.getElementById('statPending').textContent = stats.pending;
    document.getElementById('statDelivered').textContent = stats.delivered;
    document.getElementById('statStock').textContent = stats.stock;
    document.getElementById('statRevenue').textContent = `¥${stats.revenue}`;
}

// 加载订单列表
function loadOrders(filter = 'all') {
    let orders = LocalStorage.getOrders();

    if (filter !== 'all') {
        orders = orders.filter(o => o.status === filter);
    }

    const tbody = document.getElementById('ordersTableBody');
    const noOrders = document.getElementById('noOrders');

    if (orders.length === 0) {
        tbody.innerHTML = '';
        noOrders.style.display = 'block';
        return;
    }

    noOrders.style.display = 'none';
    tbody.innerHTML = orders.map(order => `
    <tr>
      <td><code>${order.order_no}</code></td>
      <td>${order.contact}</td>
      <td>${order.payment_id}</td>
      <td>
        <span class="status-badge ${order.status === 'delivered' ? 'status-delivered' : 'status-pending'}">
          ${order.status === 'delivered' ? '已发货' : '待处理'}
        </span>
      </td>
      <td>${formatDate(order.created_at)}</td>
      <td>
        ${order.status === 'pending'
            ? `<button class="btn btn-success" onclick="deliverOrder('${order.id}')">发货</button>`
            : `<span style="color: var(--text-muted);">已完成</span>`
        }
      </td>
    </tr>
  `).join('');
}

// 筛选订单
function filterOrders() {
    const filter = document.getElementById('orderFilter').value;
    loadOrders(filter);
}

// 发货
async function deliverOrder(orderId) {
    try {
        // 获取可用文件
        const file = LocalStorage.getAvailableFile();

        if (!file) {
            showToast('库存为空，无法发货！', 'error');
            return;
        }

        // 标记文件已售出
        LocalStorage.markFileSold(file.id, orderId);

        // 更新订单状态
        LocalStorage.updateOrder(orderId, {
            status: 'delivered',
            file_id: file.id,
            file_content: file.content,
            delivered_at: new Date().toISOString()
        });

        showToast('发货成功！');
        refreshData();

    } catch (error) {
        console.error('发货失败:', error);
        showToast('发货失败，请重试', 'error');
    }
}

// 加载库存文件
function loadFiles() {
    const files = LocalStorage.getFiles();
    const fileList = document.getElementById('fileList');
    const noFiles = document.getElementById('noFiles');

    if (files.length === 0) {
        fileList.innerHTML = '';
        noFiles.style.display = 'block';
        return;
    }

    noFiles.style.display = 'none';
    fileList.innerHTML = files.map(file => `
    <div class="file-item ${file.is_sold ? 'sold' : ''}">
      <span class="filename">${file.content.substring(0, 50)}${file.content.length > 50 ? '...' : ''}</span>
      <span class="status-badge ${file.is_sold ? 'status-delivered' : 'status-pending'}">
        ${file.is_sold ? '已售出' : '可用'}
      </span>
    </div>
  `).join('');
}

// 显示上传模态框
function showUploadModal() {
    document.getElementById('uploadModal').classList.add('active');
}

// 关闭上传模态框
function closeUploadModal() {
    document.getElementById('uploadModal').classList.remove('active');
    document.getElementById('uploadContent').value = '';
}

// 上传文件
function uploadFiles() {
    const content = document.getElementById('uploadContent').value.trim();

    if (!content) {
        showToast('请输入文件内容', 'error');
        return;
    }

    // 按行分割
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
        showToast('请输入有效内容', 'error');
        return;
    }

    try {
        LocalStorage.addFiles(lines);
        showToast(`成功添加 ${lines.length} 个库存`);
        closeUploadModal();
        refreshData();
    } catch (error) {
        console.error('上传失败:', error);
        showToast('上传失败，请重试', 'error');
    }
}

// 页面加载时检查登录状态
document.addEventListener('DOMContentLoaded', checkAdminLogin);

// 回车提交登录
document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('adminPassword');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                adminLogin();
            }
        });
    }
});
