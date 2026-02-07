// ==========================================
// 核心应用逻辑
// ==========================================

// 本地存储管理器（用于演示和无服务器模式）
const LocalStorage = {
    getOrders() {
        return JSON.parse(localStorage.getItem('orders') || '[]');
    },

    saveOrders(orders) {
        localStorage.setItem('orders', JSON.stringify(orders));
    },

    getFiles() {
        return JSON.parse(localStorage.getItem('files') || '[]');
    },

    saveFiles(files) {
        localStorage.setItem('files', JSON.stringify(files));
    },

    addOrder(order) {
        const orders = this.getOrders();
        orders.unshift(order);
        this.saveOrders(orders);
        return order;
    },

    addFiles(contents) {
        const files = this.getFiles();
        const newFiles = contents.map((content, index) => ({
            id: Date.now().toString() + index,
            content: content,
            is_sold: false,
            order_id: null,
            created_at: new Date().toISOString()
        }));
        files.push(...newFiles);
        this.saveFiles(files);
        return newFiles;
    },

    getAvailableFile() {
        const files = this.getFiles();
        return files.find(f => !f.is_sold);
    },

    markFileSold(fileId, orderId) {
        const files = this.getFiles();
        const file = files.find(f => f.id === fileId);
        if (file) {
            file.is_sold = true;
            file.order_id = orderId;
            this.saveFiles(files);
        }
        return file;
    },

    updateOrder(orderId, updates) {
        const orders = this.getOrders();
        const order = orders.find(o => o.id === orderId);
        if (order) {
            Object.assign(order, updates);
            this.saveOrders(orders);
        }
        return order;
    },

    findOrderByNo(orderNo) {
        const orders = this.getOrders();
        return orders.find(o => o.order_no === orderNo);
    },

    getStats() {
        const orders = this.getOrders();
        const files = this.getFiles();
        return {
            pending: orders.filter(o => o.status === 'pending').length,
            delivered: orders.filter(o => o.status === 'delivered').length,
            stock: files.filter(f => !f.is_sold).length,
            revenue: orders.filter(o => o.status === 'delivered').length * CONFIG.PRODUCT.price
        };
    }
};

// ==========================================
// 工具函数
// ==========================================

function generateOrderNo() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD${timestamp}${random}`;
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    toastMessage.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ==========================================
// 前台功能：提交订单
// ==========================================

async function submitOrder() {
    const contact = document.getElementById('contact').value.trim();
    const paymentId = document.getElementById('paymentId').value.trim();
    const remark = document.getElementById('remark')?.value.trim() || '';

    // 验证
    if (!contact) {
        showToast('请填写联系方式', 'error');
        return;
    }

    if (!paymentId || paymentId.length !== 4) {
        showToast('请填写支付宝交易号后4位', 'error');
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading"></span> 提交中...';

    try {
        const orderNo = generateOrderNo();
        const order = {
            id: Date.now().toString(),
            order_no: orderNo,
            contact: contact,
            payment_id: paymentId,
            remark: remark,
            status: 'pending',
            file_id: null,
            file_content: null,
            created_at: new Date().toISOString()
        };

        if (USE_LOCAL_STORAGE) {
            LocalStorage.addOrder(order);
        } else {
            // Supabase 插入逻辑（待配置后启用）
            // await supabase.from('orders').insert(order);
        }

        // 显示成功信息
        document.getElementById('orderForm').style.display = 'none';
        document.getElementById('orderSuccess').style.display = 'block';
        document.getElementById('displayOrderNo').textContent = orderNo;

        showToast('订单提交成功！');

    } catch (error) {
        console.error('提交订单失败:', error);
        showToast('提交失败，请重试', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '提交订单';
    }
}

// ==========================================
// 前台功能：查询订单
// ==========================================

async function queryOrder() {
    const orderNo = document.getElementById('orderNo').value.trim();

    if (!orderNo) {
        showToast('请输入订单号', 'error');
        return;
    }

    try {
        let order;

        if (USE_LOCAL_STORAGE) {
            order = LocalStorage.findOrderByNo(orderNo);
        } else {
            // Supabase 查询逻辑（待配置后启用）
            // const { data } = await supabase.from('orders').select('*').eq('order_no', orderNo).single();
            // order = data;
        }

        if (!order) {
            showToast('订单不存在', 'error');
            return;
        }

        // 显示订单信息
        document.getElementById('querySection').style.display = 'none';
        document.getElementById('orderResult').style.display = 'block';

        const resultTitle = document.getElementById('resultTitle');
        const statusBadge = document.getElementById('statusBadge');
        const orderInfo = document.getElementById('orderInfo');
        const downloadBox = document.getElementById('downloadBox');

        if (order.status === 'delivered') {
            resultTitle.textContent = '🎉 订单已发货';
            statusBadge.innerHTML = '<span class="status-badge status-delivered">已发货</span>';
            orderInfo.innerHTML = `
        <p style="color: var(--text-secondary); margin-top: 16px;">
          订单号：${order.order_no}<br>
          发货时间：${formatDate(order.delivered_at || order.created_at)}
        </p>
      `;
            downloadBox.style.display = 'block';
            document.getElementById('downloadContent').textContent = order.file_content || '内容加载失败';
        } else {
            resultTitle.textContent = '⏳ 等待发货';
            statusBadge.innerHTML = '<span class="status-badge status-pending">待处理</span>';
            orderInfo.innerHTML = `
        <p style="color: var(--text-secondary); margin-top: 16px;">
          订单号：${order.order_no}<br>
          提交时间：${formatDate(order.created_at)}<br><br>
          店主正在处理您的订单，请稍后刷新查询。
        </p>
      `;
            downloadBox.style.display = 'none';
        }

    } catch (error) {
        console.error('查询订单失败:', error);
        showToast('查询失败，请重试', 'error');
    }
}

function resetQuery() {
    document.getElementById('querySection').style.display = 'block';
    document.getElementById('orderResult').style.display = 'none';
    document.getElementById('orderNo').value = '';
}

function copyContent() {
    const content = document.getElementById('downloadContent').textContent;
    navigator.clipboard.writeText(content).then(() => {
        showToast('已复制到剪贴板');
    }).catch(() => {
        showToast('复制失败，请手动复制', 'error');
    });
}
