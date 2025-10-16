// ================================
// Ma Lu 幽灵数据全面诊断脚本
// ================================

console.log('🔍 === Ma Lu 数据来源追踪开始 ===');

async function debugMaLuSource() {
    const results = {
        localStorage: null,
        appointmentCache: null,
        firebaseCollections: {},
        dataManagerMethods: {},
        errorLogs: []
    };

    try {
        // 1. 检查 localStorage
        console.log('\n📦 检查 localStorage...');
        const localData = JSON.parse(localStorage.getItem('dental_clinic_data') || '{}');
        const localMaLu = [];

        if (localData.appointments) {
            Object.keys(localData.appointments).forEach(date => {
                const dayApps = localData.appointments[date] || [];
                dayApps.forEach(app => {
                    if (app.patientName && app.patientName.toLowerCase().includes('ma lu')) {
                        localMaLu.push({ date, appointment: app });
                    }
                });
            });
        }

        results.localStorage = {
            found: localMaLu.length > 0,
            count: localMaLu.length,
            appointments: localMaLu
        };
        console.log('localStorage Ma Lu 数据:', results.localStorage);

        // 2. 检查 appointmentCache (如果存在)
        console.log('\n💾 检查 appointmentCache...');
        if (typeof appointmentCache !== 'undefined') {
            const cacheMaLu = [];
            appointmentCache.forEach((appointments, dateKey) => {
                appointments.forEach(app => {
                    if (app.patientName && app.patientName.toLowerCase().includes('ma lu')) {
                        cacheMaLu.push({ date: dateKey, appointment: app });
                    }
                });
            });
            results.appointmentCache = {
                found: cacheMaLu.length > 0,
                count: cacheMaLu.length,
                appointments: cacheMaLu,
                totalCacheSize: appointmentCache.size
            };
        } else {
            results.appointmentCache = { available: false };
        }
        console.log('appointmentCache Ma Lu 数据:', results.appointmentCache);

        // 3. 直接查询 Firebase 集合
        console.log('\n🔥 直接查询 Firebase 集合...');

        if (window.dataManager && window.dataManager.firebaseService) {
            try {
                // 获取今天的数据 (2025-09-29)
                const today = '2025-09-29';
                console.log('🔥 查询 Firebase appointments 集合 for', today);

                const todayApps = await window.dataManager.firebaseService.getAppointmentsForDate(
                    today,
                    'owner',
                    ['arcadia', 'irvine', 'south-pasadena', 'rowland-heights', 'eastvale']
                );

                const firebaseMaLu = todayApps.filter(app =>
                    app.patientName && app.patientName.toLowerCase().includes('ma lu')
                );

                results.firebaseCollections.appointments = {
                    date: today,
                    totalCount: todayApps.length,
                    allAppointments: todayApps.map(app => ({
                        id: app.id,
                        patientName: app.patientName,
                        clinicLocation: app.clinicLocation,
                        appointmentDateTime: app.appointmentDateTime
                    })),
                    maLuCount: firebaseMaLu.length,
                    maLuAppointments: firebaseMaLu
                };

                console.log('Firebase appointments 集合:', results.firebaseCollections.appointments);

            } catch (error) {
                results.errorLogs.push(`Firebase query error: ${error.message}`);
                console.error('❌ Firebase 查询错误:', error);
            }
        }

        // 4. 测试 dataManager 方法
        console.log('\n🎯 测试 dataManager 方法...');

        if (window.dataManager) {
            try {
                const dmResult = await window.dataManager.getAppointmentsForDate('2025-09-29');
                const dmMaLu = dmResult.filter(app =>
                    app.patientName && app.patientName.toLowerCase().includes('ma lu')
                );

                results.dataManagerMethods.getAppointmentsForDate = {
                    totalCount: dmResult.length,
                    maLuCount: dmMaLu.length,
                    maLuAppointments: dmMaLu,
                    allAppointments: dmResult.map(app => app.patientName)
                };

                console.log('dataManager.getAppointmentsForDate 结果:', results.dataManagerMethods.getAppointmentsForDate);

            } catch (error) {
                results.errorLogs.push(`DataManager method error: ${error.message}`);
                console.error('❌ DataManager 方法错误:', error);
            }
        }

        // 5. 总结分析
        console.log('\n📊 === 诊断总结 ===');
        console.log('结果汇总:', results);

        const sources = [];
        if (results.localStorage?.found) sources.push('localStorage');
        if (results.appointmentCache?.found) sources.push('appointmentCache');
        if (results.firebaseCollections.appointments?.maLuCount > 0) sources.push('Firebase');

        console.log('🎯 Ma Lu 数据发现于:', sources.length > 0 ? sources : '未找到');

        if (sources.length === 0) {
            console.log('⚠️ 奇怪！所有数据源都没有找到 Ma Lu，但 dashboard 仍然显示...');
            console.log('💡 建议检查：');
            console.log('1. 是否有其他缓存机制');
            console.log('2. 是否有硬编码的测试数据');
            console.log('3. 浏览器缓存是否需要清理');
        }

        return results;

    } catch (error) {
        console.error('❌ 诊断脚本执行错误:', error);
        results.errorLogs.push(`Script error: ${error.message}`);
        return results;
    }
}

// 执行诊断
debugMaLuSource().then(results => {
    console.log('🎉 诊断完成！结果已保存到 window.maLuDebugResults');
    window.maLuDebugResults = results;
}).catch(error => {
    console.error('❌ 诊断脚本失败:', error);
});