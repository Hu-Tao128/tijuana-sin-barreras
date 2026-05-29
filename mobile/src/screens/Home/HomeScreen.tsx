import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import Button from '../../components/Button';
import CardReport from '../../components/CardReport';
import {
  BARRIER_TYPE_LABELS,
} from '../../services/types';
import type { Report, ReportStatus } from '../../services/types';

interface ReportSnapshot {
  id: string;
  title: string;
  description: string;
  status: ReportStatus;
  location: string;
  severity?: number;
  confirmations?: number;
  rejections?: number;
  createdAt?: number;
  type?: string;
}

export default function HomeScreen({ navigation }: any) {
  const [userName, setUserName] = useState('Ciudadano');
  const [reports, setReports] = useState<ReportSnapshot[]>([]);
  const [stats, setStats] = useState({ active: 0, solved: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth().currentUser;

    if (currentUser) {
      if (currentUser.displayName) {
        setUserName(currentUser.displayName);
      } else if (currentUser.email) {
        const emailName = currentUser.email.split('@')[0];
        setUserName(
          emailName.charAt(0).toUpperCase() + emailName.slice(1),
        );
      }
    }

    const reportsRef = database().ref('reports');

    const unsubscribe = reportsRef.on('value', (snapshot) => {
      const data = snapshot.val() as Record<string, any> | null;
      if (!data) {
        setReports([]);
        setStats({ active: 0, solved: 0 });
        setLoading(false);
        return;
      }

      const entries = Object.entries(data).map(([key, val]) => ({
        ...val,
        id: key,
      })) as Report[];

      entries.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

      const mapped: ReportSnapshot[] = entries.slice(0, 10).map((r) => ({
        id: r.id,
        title: BARRIER_TYPE_LABELS[r.type] ?? r.type ?? 'Barrera',
        description: r.description ?? 'Sin descripción',
        status: r.status as ReportStatus,
        location: `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}`,
        severity: r.severity,
        confirmations: r.confirmations ?? 0,
        rejections: r.rejections ?? 0,
        createdAt: r.createdAt,
        type: r.type,
      }));

      setReports(mapped);

      const active =
        entries.filter((r) => r.status === 'pending' || r.status === 'verified')
          .length;
      const archived = entries.filter((r) => r.status === 'archived').length;

      setStats({ active, solved: archived });
      setLoading(false);
    });

    return () => reportsRef.off('value', unsubscribe);
  }, []);

  const handleGoToReport = () => {
    navigation.navigate('Report');
  };

  const handleReportPress = (reportId: string) => {
    navigation.navigate('ReportDetail', { reportId });
  };

  const renderHeader = () => (
    <View>
      <View style={styles.headerContainer}>
        <Text style={styles.welcomeText}>Hola, {userName} 👋</Text>
        <Text style={styles.appTitle}>Tijuana Sin Barreras</Text>
      </View>

      <View style={styles.impactCard}>
        <Text style={styles.impactTitle}>Impacto en tu ciudad 📍</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.active}</Text>
            <Text style={styles.statLabel}>Reportes Activos</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.solved}</Text>
            <Text style={styles.statLabel}>Solucionados</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionContainer}>
        <Text style={styles.sectionTitle}>¿Detectaste un obstáculo?</Text>
        <Button
          title="📸 Reportar Nueva Barrera"
          onPress={handleGoToReport}
          variant="primary"
        />
      </View>

      <Text style={styles.sectionTitleExtra}>Reportes recientes en la comunidad</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#611232" />
          <Text style={styles.loadingText}>Cargando reportes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CardReport
            title={item.title}
            description={item.description}
            status={item.status}
            location={item.location}
            severity={item.severity}
            confirmations={item.confirmations}
            rejections={item.rejections}
            onPress={() => handleReportPress(item.id)}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No hay reportes aún</Text>
            <Text style={styles.emptySubtitle}>
              Sé el primero en reportar una barrera de accesibilidad en Tijuana.
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#767676',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  headerContainer: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  impactCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  impactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#dee2e6',
  },
  actionContainer: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 10,
  },
  sectionTitleExtra: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 10,
    marginTop: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#161A1D',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#767676',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
