#!/usr/bin/env node

/**
 * Script para limpiar notificaciones duplicadas
 * Ejecutar con: node scripts/cleanup-notifications.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, orderBy, limit, getDocs, writeBatch, doc } = require('firebase/firestore');

// Configuración de Firebase (ajustar según tu proyecto)
const firebaseConfig = {
  // Agregar configuración de Firebase aquí
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanupDuplicateNotifications(userId) {
  try {
    console.log('🧹 Iniciando limpieza de notificaciones duplicadas...');
    
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(200) // Procesar últimas 200 notificaciones
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log('No se encontraron notificaciones');
      return;
    }
    
    // Agrupar por tipo y título para encontrar duplicados
    const groupedNotifications = new Map();
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const key = `${data.type}|${data.title}`;
      
      if (!groupedNotifications.has(key)) {
        groupedNotifications.set(key, []);
      }
      groupedNotifications.get(key).push({ id: doc.id, ...data });
    });
    
    let duplicatesRemoved = 0;
    const batch = writeBatch(db);
    
    // Eliminar duplicados (mantener solo la más reciente de cada grupo)
    groupedNotifications.forEach((notifications, key) => {
      if (notifications.length > 1) {
        // Ordenar por fecha de creación (más reciente primero)
        notifications.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });
        
        // Eliminar todas excepto la más reciente
        for (let i = 1; i < notifications.length; i++) {
          const ref = doc(db, 'notifications', notifications[i].id);
          batch.delete(ref);
          duplicatesRemoved++;
        }
      }
    });
    
    if (duplicatesRemoved > 0) {
      await batch.commit();
      console.log(`🧹 Limpieza completada: ${duplicatesRemoved} notificaciones duplicadas eliminadas`);
    } else {
      console.log('🧹 No se encontraron notificaciones duplicadas');
    }
  } catch (error) {
    console.error('Error en limpieza de duplicados:', error);
  }
}

// Ejecutar limpieza para todos los usuarios o un usuario específico
async function main() {
  const userId = process.argv[2]; // Pasar userId como argumento
  
  if (!userId) {
    console.log('Uso: node scripts/cleanup-notifications.js <userId>');
    console.log('Ejemplo: node scripts/cleanup-notifications.js Q1KPUOBqePNIRz7mlBC0lCofQhi2');
    process.exit(1);
  }
  
  await cleanupDuplicateNotifications(userId);
  process.exit(0);
}

main().catch(console.error);
