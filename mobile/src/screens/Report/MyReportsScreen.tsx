import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { getMyReports } from '../../services/callable-functions';
import type { Report } from '../../services/types';
import { REPORT_CATEGORIES } from '../../services/types';

export default function MyReportsScreen({ navigation }: any) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      const result = await getMyReports();
      if (result.success) {
        setReports(result.reports);
      }
    } catch (error) {
      console.error('Error fetching my reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const getCategoryLabel = (type: string) => {
    const category = REPORT_CATEGORIES.find((c) => c.id === type);
    return category ? category.label : type;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'verified':
        return 'Verificado';
      case 'rejected':
        return 'Rechazado';
      case 'archived':
        return 'Archivado';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#767676';
      case 'verified':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      case 'archived':
        return '#3b82f6';
      default:
        return '#767676';
    }
  };

  const renderReportItem = ({ item }: { item: Report }) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => navigation.navigate('ReportDetail', { reportId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.categoryText}>{getCategoryLabel(item.type)}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>
      
      <Text style={styles.dateText}>
        {new Date(item.createdAt).toLocaleDateString('es-MX', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </Text>
      
      {item.description && (
        <Text style={styles.descriptionText} numberOfLines={2}>
          {item.description}
        </Text>
      )}
      
      <View style={styles.cardFooter}>
        <Text style={styles.severityText}>Severidad: {item.severity}/10</Text>
        <Text style={styles.votesText}>
          👍 {item.confirmations} · 👎 {item.rejections}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#611232" />
        <Text style={styles.loadingText}>Cargando tus reportes...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={renderReportItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={["#611232"]} 
            tintColor="#611232"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyTitle}>Aún no tienes reportes</Text>
            <Text style={styles.emptySubtitle}>
              Tus reportes de barreras de accesibilidad aparecerán aquí.
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('Report')}
            >
              <Text style={styles.createButtonText}>Crear mi primer reporte</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F3',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F3F3',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#767676',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#161A1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#161A1D',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 12,
    color: '#767676',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#434343',
    marginBottom: 12,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F3F3',
    paddingTop: 10,
  },
  severityText: {
    fontSize: 12,
    color: '#611232',
    fontWeight: '600',
  },
  votesText: {
    fontSize: 12,
    color: '#767676',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#161A1D',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#767676',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: '#611232',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
