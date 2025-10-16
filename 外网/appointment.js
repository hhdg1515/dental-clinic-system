// appointment.js - 预约功能数据处理
import { db } from './firebase-config.js';
import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    Timestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

/**
 * 预约状态枚举
 */
export const APPOINTMENT_STATUS = {
    PENDING: 'pending',       // 等待确认
    CONFIRMED: 'confirmed',   // 已确认
    CANCELLED: 'cancelled',   // 已取消
    COMPLETED: 'completed',   // 已完成
    NO_SHOW: 'no_show'       // 未到场
};

/**
 * 服务类型配置
 */
export const SERVICE_TYPES = {
    'general-family': 'General & Family',
    'cosmetic': 'Cosmetic', 
    'orthodontics': 'Orthodontics',
    'root-canals': 'Root Canals',
    'periodontics': 'Periodontics',
    'restorations': 'Restorations',
    'preventive-care': 'Preventive Care',
    'oral-surgery': 'Oral Surgery'
};

/**
 * 诊所信息配置
 */
export const CLINIC_LOCATIONS = {
    'arcadia': 'Arcadia',
    'rowland-heights': 'Rowland Heights', 
    'irvine': 'Irvine',
    'south-pasadena': 'South Pasadena',
    'eastvale': 'Eastvale'
};

/**
 * 营业时间配置
 */
export const BUSINESS_HOURS = {
    'monday': { start: '09:00', end: '17:00', closed: false },
    'tuesday': { start: '09:00', end: '17:00', closed: false },
    'wednesday': { start: '09:00', end: '17:00', closed: false },
    'thursday': { start: '09:00', end: '17:00', closed: false },
    'friday': { start: '09:00', end: '17:00', closed: false },
    'saturday': { start: '09:00', end: '14:00', closed: false },
    'sunday': { start: '09:00', end: '14:00', closed: false }
};

/**
 * 创建新预约 - Streamlined version with essential data only
 * @param {Object} appointmentData - 预约数据
 * @param {string} userId - 用户ID
 * @returns {Promise<string>} 预约ID
 */
export async function createAppointment(appointmentData, userId) {
    try {
        // 验证预约数据
        const validationResult = validateAppointmentData(appointmentData);
        if (!validationResult.isValid) {
            throw new Error(`预约数据验证失败: ${validationResult.errors.join(', ')}`);
        }
        
        // 检查时间冲突
        const hasConflict = await checkTimeConflict(
            appointmentData.appointmentDate,
            appointmentData.appointmentTime,
            appointmentData.clinicLocation,
            appointmentData.serviceType
        );
        
        if (hasConflict) {
            throw new Error('该时间段已被预约，请选择其他时间');
        }
        
        // 构建简化的预约文档 - 匹配内网期望格式
        const appointmentDoc = {
            // 核心预约信息
            userId: userId,
            patientName: appointmentData.patientName.trim(),
            patientPhone: appointmentData.patientPhone.trim(),
            patientEmail: appointmentData.patientEmail || '',

            // 预约时间信息
            appointmentDateTime: createAppointmentDateTime(
                appointmentData.appointmentDate,
                appointmentData.appointmentTime
            ),

            // 服务和地点信息 - 匹配内网格式
            service: SERVICE_TYPES[appointmentData.serviceType] || appointmentData.serviceType,  // 显示名称
            serviceType: appointmentData.serviceType,  // 保留原始key
            clinicLocation: appointmentData.clinicLocation,  // 'arcadia'
            location: CLINIC_LOCATIONS[appointmentData.clinicLocation] || appointmentData.clinicLocation,  // 显示名称

            // 内网需要的字段
            phone: appointmentData.patientPhone.trim(),  // 内网期望的字段名
            email: appointmentData.patientEmail || '',   // 内网期望的字段名
            notes: appointmentData.description || '',    // 内网期望的字段名

            // 状态信息
            status: APPOINTMENT_STATUS.PENDING,

            // 时间戳
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        
        // 保存到Firestore
        const docRef = await addDoc(collection(db, 'appointments'), appointmentDoc);
        
        // 发送通知（这里可以集成邮件或短信服务）
        await sendAppointmentNotifications(docRef.id, appointmentDoc);
        
        console.log('预约创建成功:', docRef.id);
        return docRef.id;
        
    } catch (error) {
        console.error('创建预约失败:', error);
        throw error;
    }
}

/**
 * 获取用户的所有预约
 * @param {string} userId - 用户ID
 * @param {number} limitCount - 限制返回数量
 * @returns {Promise<Array>} 预约列表
 */
export async function getUserAppointments(userId, limitCount = 10) {
    try {
        const q = query(
            collection(db, 'appointments'),
            where('userId', '==', userId),
            orderBy('appointmentDateTime', 'desc'),
            limit(limitCount)
        );
        
        const querySnapshot = await getDocs(q);
        const appointments = [];
        
        querySnapshot.forEach((doc) => {
            appointments.push({
                id: doc.id,
                ...doc.data(),
                // 转换Timestamp到Date
                appointmentDateTime: doc.data().appointmentDateTime?.toDate(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate()
            });
        });
        
        return appointments;
        
    } catch (error) {
        console.error('获取用户预约失败:', error);
        throw error;
    }
}

/**
 * 获取即将到来的预约
 * @param {string} userId - 用户ID
 * @returns {Promise<Array>} 即将到来的预约列表
 */
export async function getUpcomingAppointments(userId) {
    try {
        const now = Timestamp.now();
        
        const q = query(
            collection(db, 'appointments'),
            where('userId', '==', userId),
            where('appointmentDateTime', '>', now),
            where('status', 'in', [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED]),
            orderBy('appointmentDateTime', 'asc'),
            limit(5)
        );
        
        const querySnapshot = await getDocs(q);
        const appointments = [];
        
        querySnapshot.forEach((doc) => {
            appointments.push({
                id: doc.id,
                ...doc.data(),
                appointmentDateTime: doc.data().appointmentDateTime?.toDate(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate()
            });
        });
        
        return appointments;
        
    } catch (error) {
        console.error('获取即将到来的预约失败:', error);
        throw error;
    }
}

/**
 * 获取特定预约详情
 * @param {string} appointmentId - 预约ID
 * @returns {Promise<Object>} 预约详情
 */
export async function getAppointmentById(appointmentId) {
    try {
        const docRef = doc(db, 'appointments', appointmentId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                appointmentDateTime: data.appointmentDateTime?.toDate(),
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate()
            };
        } else {
            throw new Error('预约不存在');
        }
        
    } catch (error) {
        console.error('获取预约详情失败:', error);
        throw error;
    }
}

/**
 * 更新预约状态
 * @param {string} appointmentId - 预约ID
 * @param {string} newStatus - 新状态
 * @param {string} userId - 用户ID（用于权限验证）
 * @returns {Promise<void>}
 */
export async function updateAppointmentStatus(appointmentId, newStatus, userId) {
    try {
        // 验证状态值
        if (!Object.values(APPOINTMENT_STATUS).includes(newStatus)) {
            throw new Error('无效的预约状态');
        }
        
        // 获取现有预约验证权限
        const appointment = await getAppointmentById(appointmentId);
        if (appointment.userId !== userId) {
            throw new Error('无权限修改此预约');
        }
        
        // 更新预约状态
        const docRef = doc(db, 'appointments', appointmentId);
        await updateDoc(docRef, {
            status: newStatus,
            updatedAt: serverTimestamp()
        });
        
        console.log('预约状态更新成功:', appointmentId, newStatus);
        
    } catch (error) {
        console.error('更新预约状态失败:', error);
        throw error;
    }
}

/**
 * 取消预约
 * @param {string} appointmentId - 预约ID
 * @param {string} userId - 用户ID
 * @param {string} reason - 取消原因
 * @returns {Promise<void>}
 */
export async function cancelAppointment(appointmentId, userId, reason = '') {
    try {
        const appointment = await getAppointmentById(appointmentId);
        
        // 验证权限
        if (appointment.userId !== userId) {
            throw new Error('无权限取消此预约');
        }
        
        // 检查是否可以取消
        if (appointment.status === APPOINTMENT_STATUS.COMPLETED) {
            throw new Error('已完成的预约无法取消');
        }
        
        // 更新预约状态
        const docRef = doc(db, 'appointments', appointmentId);
        await updateDoc(docRef, {
            status: APPOINTMENT_STATUS.CANCELLED,
            cancellationReason: reason,
            cancelledAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        
        // 发送取消通知
        await sendCancellationNotifications(appointmentId, appointment, reason);
        
        console.log('预约取消成功:', appointmentId);
        
    } catch (error) {
        console.error('取消预约失败:', error);
        throw error;
    }
}

/**
 * 检查时间冲突 - Fixed version with better error handling
 * @param {string} date - 日期 (YYYY-MM-DD)
 * @param {string} time - 时间 (HH:MM)
 * @param {string} clinicLocation - 诊所位置
 * @param {string} serviceType - 服务类型
 * @returns {Promise<boolean>} 是否有冲突
 */
export async function checkTimeConflict(date, time, clinicLocation, serviceType) {
    try {
        console.log('Checking time conflict for:', { date, time, clinicLocation, serviceType });
        
        // 创建预约时间对象，添加更好的错误处理
        let appointmentDateTime;
        try {
            appointmentDateTime = createAppointmentDateTime(date, time);
            console.log('Created appointment datetime:', appointmentDateTime);
        } catch (dateError) {
            console.error('Error creating appointment datetime:', dateError);
            // 如果日期创建失败，假设没有冲突，让预约继续
            return false;
        }
        
        // 检查日期是否有效
        if (!appointmentDateTime || isNaN(appointmentDateTime.getTime())) {
            console.warn('Invalid appointment datetime, skipping conflict check');
            return false;
        }
        
        // 服务持续时间 - 简化为固定60分钟
        const serviceDuration = 60; // 分钟
        
        // 计算服务结束时间
        const endDateTime = new Date(appointmentDateTime);
        endDateTime.setMinutes(endDateTime.getMinutes() + serviceDuration);
        
        // 创建查询时间范围（前后30分钟的缓冲）
        const rangeStart = new Date(appointmentDateTime.getTime() - 30 * 60 * 1000);
        const rangeEnd = new Date(endDateTime.getTime() + 30 * 60 * 1000);
        
        console.log('Query range:', { rangeStart, rangeEnd });
        
        // 查询在该时间范围内的预约
        const q = query(
            collection(db, 'appointments'),
            where('clinicLocation', '==', clinicLocation),
            where('status', 'in', [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED]),
            where('appointmentDateTime', '>=', Timestamp.fromDate(rangeStart)),
            where('appointmentDateTime', '<=', Timestamp.fromDate(rangeEnd))
        );
        
        const querySnapshot = await getDocs(q);
        console.log('Found potentially conflicting appointments:', querySnapshot.size);
        
        // 检查具体时间冲突
        let hasConflict = false;
        querySnapshot.forEach((doc) => {
            const existingAppointment = doc.data();
            const existingStart = existingAppointment.appointmentDateTime.toDate();
            const existingEnd = new Date(existingStart.getTime() + serviceDuration * 60 * 1000);
            
            console.log('Checking conflict with existing appointment:', {
                existing: { start: existingStart, end: existingEnd },
                new: { start: appointmentDateTime, end: endDateTime }
            });
            
            // 检查时间重叠
            if (appointmentDateTime < existingEnd && endDateTime > existingStart) {
                console.log('Time conflict detected!');
                hasConflict = true;
            }
        });
        
        console.log('Time conflict check result:', hasConflict);
        return hasConflict;
        
    } catch (error) {
        console.error('检查时间冲突失败:', error);
        console.error('Error details:', error.code, error.message);
        
        // 如果检查失败，假设没有冲突，让预约继续
        // 这样用户体验更好，避免因为检查失败而阻止预约
        return false;
    }
}

/**
 * 获取可用的时间段
 * @param {string} date - 日期 (YYYY-MM-DD)
 * @param {string} clinicLocation - 诊所位置
 * @param {string} serviceType - 服务类型
 * @returns {Promise<Array>} 可用时间段列表
 */
export async function getAvailableTimeSlots(date, clinicLocation, serviceType) {
    try {
        const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' });
        const businessHour = BUSINESS_HOURS[dayOfWeek];
        
        if (!businessHour || businessHour.closed) {
            return []; // 该日不营业
        }
        
        const serviceInfo = SERVICE_TYPES[serviceType];
        const serviceDuration = serviceInfo.duration;
        
        // 生成所有可能的时间段
        const allTimeSlots = generateTimeSlots(
            businessHour.start, 
            businessHour.end, 
            serviceDuration
        );
        
        // 获取该日期已预约的时间段
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        const q = query(
            collection(db, 'appointments'),
            where('clinicLocation', '==', clinicLocation),
            where('status', 'in', [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED]),
            where('appointmentDateTime', '>=', Timestamp.fromDate(startOfDay)),
            where('appointmentDateTime', '<=', Timestamp.fromDate(endOfDay))
        );
        
        const querySnapshot = await getDocs(q);
        const bookedSlots = [];
        
        querySnapshot.forEach((doc) => {
            const appointment = doc.data();
            bookedSlots.push({
                start: appointment.appointmentDateTime.toDate(),
                duration: SERVICE_TYPES[appointment.serviceType].duration
            });
        });
        
        // 过滤掉已预约的时间段
        const availableSlots = allTimeSlots.filter(slot => {
            const slotStart = createAppointmentDateTime(date, slot);
            const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60 * 1000);
            
            // 检查是否与已预约的时间冲突
            return !bookedSlots.some(booked => {
                const bookedStart = booked.start;
                const bookedEnd = new Date(bookedStart.getTime() + booked.duration * 60 * 1000);
                
                return slotStart < bookedEnd && slotEnd > bookedStart;
            });
        });
        
        return availableSlots;
        
    } catch (error) {
        console.error('获取可用时间段失败:', error);
        return [];
    }
}

/**
 * 验证预约数据
 * @param {Object} data - 预约数据
 * @returns {Object} 验证结果
 */
function validateAppointmentData(data) {
    const errors = [];
    
    // 必填字段验证
    if (!data.patientName || data.patientName.trim().length === 0) {
        errors.push('患者姓名不能为空');
    }
    
    if (!data.patientPhone || data.patientPhone.trim().length === 0) {
        errors.push('联系电话不能为空');
    }
    
    if (!data.appointmentDate) {
        errors.push('预约日期不能为空');
    }
    
    if (!data.appointmentTime) {
        errors.push('预约时间不能为空');
    }
    
    if (!data.clinicLocation || !CLINIC_LOCATIONS[data.clinicLocation]) {
        errors.push('请选择有效的诊所位置');
    }
    
    if (!data.serviceType || !SERVICE_TYPES[data.serviceType]) {
        errors.push('请选择有效的服务类型');
    }
    
    // 日期时间验证
    if (data.appointmentDate) {
        const appointmentDate = new Date(data.appointmentDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (appointmentDate < today) {
            errors.push('预约日期不能是过去的日期');
        }
        
        // 检查是否在3个月内
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 3);
        if (appointmentDate > maxDate) {
            errors.push('预约日期不能超过3个月');
        }
    }
    
    // 电话号码格式验证
    if (data.patientPhone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(data.patientPhone.replace(/[\s\-\(\)]/g, ''))) {
            errors.push('请输入有效的电话号码');
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * 创建预约日期时间对象 - Fixed version
 * @param {string} date - 日期 (YYYY-MM-DD)
 * @param {string} time - 时间 (HH:MM)
 * @returns {Date} 日期时间对象
 */
function createAppointmentDateTime(date, time) {
    try {
        // 确保输入格式正确
        if (!date || !time) {
            throw new Error('Date and time are required');
        }
        
        // 验证日期格式 (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new Error('Invalid date format. Expected YYYY-MM-DD');
        }
        
        // 验证时间格式 (HH:MM)
        if (!/^\d{2}:\d{2}$/.test(time)) {
            throw new Error('Invalid time format. Expected HH:MM');
        }
        
        // 创建ISO格式的日期时间字符串
        const dateTimeString = `${date}T${time}:00`;
        console.log('Creating datetime from string:', dateTimeString);
        
        const dateTime = new Date(dateTimeString);
        
        // 检查创建的日期是否有效
        if (isNaN(dateTime.getTime())) {
            throw new Error(`Invalid datetime created from: ${dateTimeString}`);
        }
        
        return dateTime;
        
    } catch (error) {
        console.error('Error in createAppointmentDateTime:', error);
        throw error;
    }
}

/**
 * 生成时间段
 * @param {string} startTime - 开始时间 (HH:MM)
 * @param {string} endTime - 结束时间 (HH:MM)
 * @param {number} duration - 服务时长（分钟）
 * @returns {Array} 时间段数组
 */
function generateTimeSlots(startTime, endTime, duration) {
    const slots = [];
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    
    let current = start;
    while (current + duration <= end) {
        slots.push(formatTime(current));
        current += 60; // 每小时一个时间段
    }
    
    return slots;
}

/**
 * 解析时间字符串为分钟数
 * @param {string} timeStr - 时间字符串 (HH:MM)
 * @returns {number} 分钟数
 */
function parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * 格式化分钟数为时间字符串
 * @param {number} minutes - 分钟数
 * @returns {string} 时间字符串 (HH:MM)
 */
function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * 发送预约通知（邮件/短信）
 * @param {string} appointmentId - 预约ID
 * @param {Object} appointmentData - 预约数据
 * @returns {Promise<void>}
 */
async function sendAppointmentNotifications(appointmentId, appointmentData) {
    try {
        // 这里可以集成邮件服务（如SendGrid）或短信服务（如Twilio）
        console.log('发送预约通知:', appointmentId);
        
        // 示例：发送邮件通知给用户
        // await sendEmail({
        //     to: appointmentData.patientEmail,
        //     subject: '预约确认 - First Ave Dental',
        //     template: 'appointment-confirmation',
        //     data: appointmentData
        // });
        
        // 示例：发送短信通知
        // await sendSMS({
        //     to: appointmentData.patientPhone,
        //     message: `您的预约已收到：${appointmentData.appointmentDate} ${appointmentData.appointmentTime} - First Ave Dental`
        // });
        
        // 发送通知给诊所管理员
        // await notifyClinic(appointmentData);
        
    } catch (error) {
        console.error('发送预约通知失败:', error);
        // 不抛出错误，避免影响预约创建流程
    }
}

/**
 * 发送取消通知
 * @param {string} appointmentId - 预约ID
 * @param {Object} appointmentData - 预约数据
 * @param {string} reason - 取消原因
 * @returns {Promise<void>}
 */
async function sendCancellationNotifications(appointmentId, appointmentData, reason) {
    try {
        console.log('发送取消通知:', appointmentId, reason);
        
        // 这里可以发送取消通知
        // await sendEmail({...});
        // await sendSMS({...});
        
    } catch (error) {
        console.error('发送取消通知失败:', error);
    }
}

/**
 * 监听用户预约变化
 * @param {string} userId - 用户ID
 * @param {Function} callback - 回调函数
 * @returns {Function} 取消监听的函数
 */
export function subscribeToUserAppointments(userId, callback) {
    const q = query(
        collection(db, 'appointments'),
        where('userId', '==', userId),
        orderBy('appointmentDateTime', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
        const appointments = [];
        querySnapshot.forEach((doc) => {
            appointments.push({
                id: doc.id,
                ...doc.data(),
                appointmentDateTime: doc.data().appointmentDateTime?.toDate(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate()
            });
        });
        
        callback(appointments);
    }, (error) => {
        console.error('监听预约变化失败:', error);
        callback([]);
    });
}

/**
 * 获取预约统计信息
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 统计信息
 */
export async function getAppointmentStats(userId) {
    try {
        const appointments = await getUserAppointments(userId, 100);
        
        const stats = {
            total: appointments.length,
            pending: 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0,
            upcoming: 0
        };
        
        const now = new Date();
        
        appointments.forEach(appointment => {
            stats[appointment.status]++;
            if (appointment.appointmentDateTime > now && 
                (appointment.status === APPOINTMENT_STATUS.PENDING || 
                 appointment.status === APPOINTMENT_STATUS.CONFIRMED)) {
                stats.upcoming++;
            }
        });
        
        return stats;
        
    } catch (error) {
        console.error('获取预约统计失败:', error);
        return {
            total: 0,
            pending: 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0,
            upcoming: 0
        };
    }
}

/**
 * 获取用户最后一次预约记录
 * @param {string} userId - 用户ID
 * @returns {Promise<Object|null>} 最后的预约记录或null
 */
export async function getLastUserAppointment(userId) {
    try {
        const q = query(
            collection(db, "appointments"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc"),
            limit(1)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].data();
        }
        
        return null;
    } catch (error) {
        console.error("Error fetching last appointment:", error);
        return null;
    }
}