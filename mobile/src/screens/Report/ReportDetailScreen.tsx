import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Image,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import database from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';
import {
  confirmReport,
  rejectReport,
  addComment,
  getReportComments,
} from '../../services/callable-functions';
import {
  BARRIER_TYPE_LABELS,
  REPORT_STATUS_LABELS,
  SEVERITY_LEVELS,
} from '../../services/types';
import type { Report, Comment } from '../../services/types';

export default function ReportDetailScreen({ route, navigation }: any) {
  const { reportId } = route.params as { reportId: string };

  const [report, setReport] = useState<Report | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingComment, setSendingComment] = useState(false);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: 'Detalle del Reporte' });

    const ref = database().ref(`reports/${reportId}`);

    const unsubscribe = ref.on('value', (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setReport({
          ...val,
          id: reportId,
        } as Report);
      }
      setLoading(false);
    });

    loadComments();

    return () => ref.off('value', unsubscribe);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId, navigation]);

  const loadComments = async () => {
    try {
      const result = await getReportComments({ reportId });
      if (result.success && result.comments) {
        setComments(result.comments);
      }
    } catch (err: any) {
      console.log('Error cargando comentarios:', err?.message ?? err);
    }
  };

  const handleSendComment = async () => {
    const text = newComment.trim();
    if (!text) return;

    setSendingComment(true);
    try {
      const user = auth().currentUser;
      const optimistic: Comment = {
        id: `temp-${Date.now()}`,
        reportId,
        userId: user?.uid ?? '',
        displayName: user?.displayName ?? 'Usuario',
        text,
        createdAt: Date.now(),
      };

      setComments((prev) => [...prev, optimistic]);
      setNewComment('');

      const result = await addComment({ reportId, text });
      if (result.success) {
        await loadComments();
      }
    } catch (err: any) {
      const message =
        err?.message ?? err?.code ?? 'Error desconocido al enviar comentario.';
      Alert.alert('Error al comentar', message);
      setComments((prev) =>
        prev.filter((c) => !c.id.startsWith('temp-')),
      );
      setNewComment(newComment);
    } finally {
      setSendingComment(false);
    }
  };

  const handleConfirm = async () => {
    setVoting(true);
    try {
      await confirmReport({ reportId });
      Alert.alert('Voto registrado', 'Has confirmado que este reporte es real.');
    } catch (error: any) {
      if (error?.code === 'already-exists') {
        Alert.alert('Ya votaste', 'Ya has confirmado este reporte.');
      } else {
        const msg = error?.message ?? error?.code ?? 'Error desconocido.';
        Alert.alert('Error al votar', msg);
      }
    } finally {
      setVoting(false);
    }
  };

  const handleReject = async () => {
    setVoting(true);
    try {
      await rejectReport({ reportId });
      Alert.alert('Voto registrado', 'Has rechazado este reporte.');
    } catch (error: any) {
      if (error?.code === 'already-exists') {
        Alert.alert('Ya votaste', 'Ya has rechazado este reporte.');
      } else {
        const msg = error?.message ?? error?.code ?? 'Error desconocido.';
        Alert.alert('Error al votar', msg);
      }
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#611232" />
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Reporte no encontrado.</Text>
      </View>
    );
  }

  const currentUserId = auth().currentUser?.uid;

  const severityLabel =
    SEVERITY_LEVELS.find((s) => s.value <= report.severity)?.label ??
    'Desconocida';
  const severityColor =
    SEVERITY_LEVELS.find((s) => s.value <= report.severity)?.color ?? '#6b7280';

  const dateStr = report.createdAt
    ? new Date(report.createdAt).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Fecha desconocida';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F3F3" />

      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={
          <View>
            {report.photoUrl ? (
              <Image
                source={{ uri: report.photoUrl }}
                style={styles.reportPhoto}
              />
            ) : null}

            <View style={styles.sectionCard}>
              <View style={styles.typeRow}>
                <Text style={styles.typeLabel}>
                  {BARRIER_TYPE_LABELS[report.type] ?? report.type}
                </Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {REPORT_STATUS_LABELS[report.status]}
                  </Text>
                </View>
              </View>

              <View style={styles.severityRow}>
                <View
                  style={[styles.severityDot, { backgroundColor: severityColor }]}
                />
                <Text style={styles.severityLabel}>
                  Severidad: {severityLabel} ({report.severity}/10)
                </Text>
              </View>

              {report.description ? (
                <Text style={styles.description}>{report.description}</Text>
              ) : null}

              <Text style={styles.metaText}>Reportado el {dateStr}</Text>

              <View style={styles.coordsRow}>
                <Text style={styles.metaText}>
                  📍 {report.latitude.toFixed(5)},{' '}
                  {report.longitude.toFixed(5)}
                </Text>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Confirmaciones de la comunidad</Text>

              <View style={styles.voteStats}>
                <View style={styles.voteBox}>
                  <Text style={styles.voteNumber}>{report.confirmations}</Text>
                  <Text style={styles.voteLabel}>Confirmaciones</Text>
                </View>
                <View style={styles.voteDivider} />
                <View style={styles.voteBox}>
                  <Text style={styles.voteNumber}>{report.rejections}</Text>
                  <Text style={styles.voteLabel}>Rechazos</Text>
                </View>
              </View>

              {report.status === 'pending' && currentUserId ? (
                <View style={styles.voteButtons}>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleConfirm}
                    disabled={voting}
                  >
                    <Text style={styles.confirmButtonText}>
                      {voting ? '...' : '✅ Confirmar que es real'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={handleReject}
                    disabled={voting}
                  >
                    <Text style={styles.rejectButtonText}>
                      {voting ? '...' : '❌ Reportar como falso'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Comentarios ({comments.length})</Text>

              <View style={styles.commentInputRow}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Añade un comentario..."
                  placeholderTextColor="#767676"
                  value={newComment}
                  onChangeText={setNewComment}
                  maxLength={500}
                  multiline
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!newComment.trim() || sendingComment) &&
                      styles.sendButtonDisabled,
                  ]}
                  onPress={handleSendComment}
                  disabled={!newComment.trim() || sendingComment}
                >
                  {sendingComment ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.sendButtonText}>Enviar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {comments.length === 0 ? (
              <Text style={styles.noComments}>
                Sé el primero en comentar este reporte.
              </Text>
            ) : (
              <View style={styles.commentSpacer} />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.commentCard}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentAuthor}>{item.displayName}</Text>
              <Text style={styles.commentDate}>
                {new Date(item.createdAt).toLocaleDateString('es-MX')}
              </Text>
            </View>
            <Text style={styles.commentText}>{item.text}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F3',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F3F3',
  },
  emptyText: {
    fontSize: 16,
    color: '#767676',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  reportPhoto: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 16,
    resizeMode: 'cover',
    backgroundColor: '#DDD',
  },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DDD',
    elevation: 2,
    shadowColor: '#161A1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#611232',
    marginBottom: 12,
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#161A1D',
  },
  statusBadge: {
    backgroundColor: '#F3F3F3',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#767676',
  },
  severityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  severityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  severityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#434343',
  },
  description: {
    fontSize: 15,
    color: '#161A1D',
    lineHeight: 22,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 13,
    color: '#767676',
  },
  coordsRow: {
    marginTop: 4,
  },
  voteStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  voteBox: {
    alignItems: 'center',
    flex: 1,
  },
  voteNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#611232',
  },
  voteLabel: {
    fontSize: 12,
    color: '#767676',
    fontWeight: '500',
    marginTop: 2,
  },
  voteDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#DDD',
  },
  voteButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  commentInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F3F3F3',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#161A1D',
    maxHeight: 80,
  },
  sendButton: {
    backgroundColor: '#611232',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#DDD',
  },
  sendButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  noComments: {
    fontSize: 14,
    color: '#767676',
    textAlign: 'center',
    marginTop: 0,
    fontStyle: 'italic',
  },
  commentSpacer: {
    marginBottom: 8,
  },
  commentCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F3F3',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '700',
    color: '#611232',
  },
  commentDate: {
    fontSize: 11,
    color: '#767676',
  },
  commentText: {
    fontSize: 14,
    color: '#434343',
    lineHeight: 20,
  },
});
