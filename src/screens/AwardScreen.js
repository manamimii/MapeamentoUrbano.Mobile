import React, {
  useCallback,
  useState,
} from 'react';

import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { awardService } from '../services/awardService';

const PAGE_SIZE = 10;

const MEDAL_CONFIG = {
  ouro: {
    label: 'Ouro',
    color: '#D4A017',
    background: '#FFF6D9',
  },
  prata: {
    label: 'Prata',
    color: '#8995A7',
    background: '#EDF1F5',
  },
  bronze: {
    label: 'Bronze',
    color: '#AD754B',
    background: '#F8E9DE',
  },
};

const normalizeMedalName = (name) => {
  return String(name ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
};

const getMedalConfig = (name) => {
  return MEDAL_CONFIG[normalizeMedalName(name)] || {
    label: name || 'Medalha',
    color: '#203A6F',
    background: '#E8EDF7',
  };
};

const formatDate = (value) => {
  if (!value) return 'Data não informada';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Data não informada';
  }

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

function MedalCard({ medal }) {
  const config = getMedalConfig(medal.medalName);

  return (
    <View style={styles.medalCard}>
      <View
        style={[
          styles.medalIcon,
          { backgroundColor: config.background },
        ]}
      >
        <Ionicons
          name="medal-outline"
          size={35}
          color={config.color}
        />
      </View>

      <View style={styles.medalInfo}>
        <Text style={styles.medalTitle}>
          Medalha de {config.label}
        </Text>

        <Text style={styles.medalDate}>
          {formatDate(medal.awardDate)}
        </Text>

        <View style={styles.pointsRow}>
          <Ionicons
            name="star-outline"
            size={16}
            color="#203A6F"
          />

          <Text style={styles.pointsText}>
            {Number(medal.medalPoints ?? 0)
              .toLocaleString('pt-BR')} pontos
          </Text>
        </View>
      </View>
    </View>
  );
}

function MedalSummary({ medals }) {
  const counts = {
    ouro: 0,
    prata: 0,
    bronze: 0,
  };

  medals.forEach(medal => {
    const key = normalizeMedalName(medal.medalName);

    if (Object.prototype.hasOwnProperty.call(counts, key)) {
      counts[key] += 1;
    }
  });

  return (
    <View style={styles.summaryRow}>
      {Object.entries(MEDAL_CONFIG).map(([key, config]) => (
        <View
          key={key}
          style={[
            styles.summaryCard,
            { backgroundColor: config.background },
          ]}
        >
          <Ionicons
            name="medal"
            size={30}
            color={config.color}
          />

          <Text style={styles.summaryLabel}>
            {config.label}
          </Text>

          <Text style={styles.summaryCount}>
            {counts[key]}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function AwardScreen() {
  const [medals, setMedals] = useState([]);
  const [pageIndex, setPageIndex] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadMedals = useCallback(async (
    page = 1,
    refresh = false
  ) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const data = await awardService.getProfileAwards(
        page,
        PAGE_SIZE
      );

      const items = Array.isArray(data?.itemsOnPage)
        ? data.itemsOnPage
        : [];

      const total = Number(data?.totalItems ?? 0);
      const size = Number(data?.pageSize ?? PAGE_SIZE);

      setMedals(items);
      setTotalItems(total);
      setTotalPages(
        Math.max(1, Math.ceil(total / (size || PAGE_SIZE)))
      );
      setPageIndex(page);
    } catch (err) {
      setError(
        err.message || 'Não foi possível carregar as medalhas.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMedals(1);
    }, [loadMedals])
  );

  const handlePrevious = () => {
    if (!loading && pageIndex > 1) {
      loadMedals(pageIndex - 1);
    }
  };

  const handleNext = () => {
    if (!loading && pageIndex < totalPages) {
      loadMedals(pageIndex + 1);
    }
  };

  if (loading && medals.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#203A6F"
        />

        <Text style={styles.subtitle}>
          Carregando medalhas...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={medals}
        keyExtractor={(item, index) =>
          `${item.awardDate}-${item.medalName}-${index}`
        }
        renderItem={({ item }) => (
          <MedalCard medal={item} />
        )}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadMedals(pageIndex, true)}
            colors={['#203A6F']}
          />
        }
        ListHeaderComponent={
          <>
            <Text style={styles.title}>
              Minhas medalhas
            </Text>

            <Text style={styles.subtitle}>
              Acompanhe suas conquistas e pontuações.
            </Text>

            <MedalSummary medals={medals} />

            <Text style={styles.sectionTitle}>
              Histórico de conquistas
            </Text>

            <Text style={styles.totalText}>
              {totalItems} medalha(s) conquistada(s)
            </Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name={error ? 'alert-circle-outline' : 'trophy-outline'}
              size={52}
              color="#94A3B8"
            />

            <Text style={styles.emptyText}>
              {error || 'Você ainda não conquistou medalhas.'}
            </Text>

            {error && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => loadMedals(pageIndex)}
              >
                <Text style={styles.retryText}>
                  Tentar novamente
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ListFooterComponent={
          totalItems > 0 ? (
            <View style={styles.pagination}>
              <TouchableOpacity
                style={[
                  styles.pageButton,
                  (pageIndex === 1 || loading) &&
                    styles.disabledButton,
                ]}
                disabled={pageIndex === 1 || loading}
                onPress={handlePrevious}
              >
                <Ionicons
                  name="chevron-back"
                  size={18}
                  color="#FFFFFF"
                />

                <Text style={styles.pageButtonText}>
                  Anterior
                </Text>
              </TouchableOpacity>

              <Text style={styles.pageText}>
                {pageIndex} / {totalPages}
              </Text>

              <TouchableOpacity
                style={[
                  styles.pageButton,
                  (pageIndex >= totalPages || loading) &&
                    styles.disabledButton,
                ]}
                disabled={pageIndex >= totalPages || loading}
                onPress={handleNext}
              >
                <Text style={styles.pageButtonText}>
                  Próxima
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  content: {
    padding: 18,
    paddingBottom: 40,
    flexGrow: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000E35',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 30,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  summaryCount: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#203A6F',
  },
  totalText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 5,
    marginBottom: 18,
  },
  medalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 17,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  medalIcon: {
    width: 72,
    height: 72,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  medalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 5,
  },
  medalDate: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 10,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#203A6F',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 65,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 14,
  },
  retryButton: {
    marginTop: 16,
    padding: 12,
  },
  retryText: {
    color: '#203A6F',
    fontWeight: 'bold',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 20,
  },
  pageButton: {
    backgroundColor: '#203A6F',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  disabledButton: {
    opacity: 0.4,
  },
  pageButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  pageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
});
