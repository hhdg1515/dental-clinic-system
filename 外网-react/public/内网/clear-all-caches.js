// ================================
// 清理所有缓存和 Ma Lu 数据
// ================================

console.log('🧹 === 开始清理所有缓存和 Ma Lu 数据 ===');

function clearAllCaches() {
    let cleaned = [];

    try {
        // 1. 清理 localStorage
        console.log('📦 清理 localStorage...');
        const localData = JSON.parse(localStorage.getItem('dental_clinic_data') || '{}');
        let localCleaned = false;

        if (localData.appointments) {
            Object.keys(localData.appointments).forEach(date => {
                if (localData.appointments[date]) {
                    const original = localData.appointments[date].length;
                    localData.appointments[date] = localData.appointments[date].filter(app => {
                        const keep = !app.patientName || !app.patientName.toLowerCase().includes('ma lu');
                        if (!keep) {
                            console.log(`🗑️ 从 localStorage 删除 Ma Lu 预约 (${date}):`, app);
                        }
                        return keep;
                    });

                    if (localData.appointments[date].length !== original) {
                        localCleaned = true;
                    }

                    if (localData.appointments[date].length === 0) {
                        delete localData.appointments[date];
                    }
                }
            });

            if (localCleaned) {
                localStorage.setItem('dental_clinic_data', JSON.stringify(localData));
                cleaned.push('localStorage');
                console.log('✅ localStorage 已清理');
            } else {
                console.log('ℹ️ localStorage 中无 Ma Lu 数据');
            }
        }

        // 2. 清理 appointmentCache
        console.log('💾 清理 appointmentCache...');
        if (typeof appointmentCache !== 'undefined' && appointmentCache) {
            let cacheCleaned = false;
            const keysToDelete = [];

            appointmentCache.forEach((appointments, dateKey) => {
                const filteredApps = appointments.filter(app => {
                    const keep = !app.patientName || !app.patientName.toLowerCase().includes('ma lu');
                    if (!keep) {
                        console.log(`🗑️ 从 cache 删除 Ma Lu 预约 (${dateKey}):`, app);
                        cacheCleaned = true;
                    }
                    return keep;
                });

                if (filteredApps.length === 0) {
                    keysToDelete.push(dateKey);
                } else if (filteredApps.length !== appointments.length) {
                    appointmentCache.set(dateKey, filteredApps);
                }
            });

            // 删除空的缓存条目
            keysToDelete.forEach(key => appointmentCache.delete(key));

            if (cacheCleaned) {
                cleaned.push('appointmentCache');
                console.log('✅ appointmentCache 已清理');
            } else {
                console.log('ℹ️ appointmentCache 中无 Ma Lu 数据');
            }
        } else {
            console.log('ℹ️ appointmentCache 不可用');
        }

        // 3. 强制清除浏览器缓存相关
        console.log('🌐 清理浏览器缓存...');
        if (typeof caches !== 'undefined') {
            caches.keys().then(names => {
                names.forEach(name => {
                    caches.delete(name);
                });
            });
            cleaned.push('browser caches');
        }

        // 4. 清理可能的其他全局变量
        console.log('🔍 清理其他可能的数据源...');
        const globalVarsToCheck = ['globalAppointments', 'cachedData', 'appointmentData'];
        globalVarsToCheck.forEach(varName => {
            if (window[varName]) {
                delete window[varName];
                console.log(`🗑️ 删除全局变量: ${varName}`);
                cleaned.push(`global.${varName}`);
            }
        });

        console.log('🎉 清理完成！已清理:', cleaned.length > 0 ? cleaned : '无需清理');

        return {
            success: true,
            cleaned: cleaned,
            message: cleaned.length > 0 ? '数据已清理，建议刷新页面' : '未发现需要清理的 Ma Lu 数据'
        };

    } catch (error) {
        console.error('❌ 清理过程中出错:', error);
        return {
            success: false,
            error: error.message,
            cleaned: cleaned
        };
    }
}

// 执行清理
const cleanResult = clearAllCaches();
console.log('清理结果:', cleanResult);

if (cleanResult.success && cleanResult.cleaned.length > 0) {
    console.log('💡 建议现在刷新页面以查看效果');
    console.log('如果 Ma Lu 仍然出现，则数据来源可能是 Firebase 或其他未知源');
}