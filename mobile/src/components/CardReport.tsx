import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import type { ReportStatus } from '../services/types';
import { REPORT_STATUS_LABELS } from '../services/types';

interface CardReportProps {
  title: string;
  description: string;
  status: ReportStatus;
  location: string;
  severity?: number;
  confirmations?: number;
  rejections?: number;
  onPress?: () => void;
}

const STATUS_STYLES: Record<
  ReportStatus,
  { textColor: string; bgColor: string; label: string }
> = {
  pending: {
    textColor: '#767676',
    bgColor: '#F3F3F3',
    label: REPORT_STATUS_LABELS.pending,
  },
  verified: {
    textColor: '#9B2247',
    bgColor: '#FDECEF',
    label: REPORT_STATUS_LABELS.verified,
  },
  rejected: {
    textColor: '#ef4444',
    bgColor: '#fef2f2',
    label: REPORT_STATUS_LABELS.rejected,
  },
  archived: {
    textColor: '#6b7280',
    bgColor: '#f3f4f6',
    label: REPORT_STATUS_LABELS.archived,
  },
};

export default function CardReport({
  title,
  description,
  status,
  location,
  confirmations = 0,
  rejections = 0,
  onPress,
}: CardReportProps) {
  const config = STATUS_STYLES[status] ?? STATUS_STYLES.pending;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        <View style={[styles.badge, { backgroundColor: config.bgColor }]}>
          <Text style={[styles.statusText, { color: config.textColor }]}>
            {config.label}
          </Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {description}
      </Text>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.location} numberOfLines={1}>
            {'📍 '}{location}
          </Text>
        </View>

        <View style={styles.votes}>
          <Text style={styles.voteText}>
            {'✅ '}{confirmations}
          </Text>
          <Text style={styles.voteText}>
            {'❌ '}{rejections}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 18,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    elevation: 3,
    shadowColor: '#161A1D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#161A1D',
    flex: 1,
    marginRight: 12,
    letterSpacing: -0.2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    color: '#434343',
    marginBottom: 14,
    lineHeight: 20,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#F3F3F3',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flex: 1,
  },
  location: {
    fontSize: 13,
    color: '#767676',
    fontWeight: '500',
  },
  votes: {
    flexDirection: 'row',
    gap: 12,
  },
  voteText: {
    fontSize: 12,
    color: '#767676',
    fontWeight: '500',
  },
});
