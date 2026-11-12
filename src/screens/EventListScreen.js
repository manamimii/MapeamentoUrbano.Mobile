import React, {
  useCallback,
  useRef,
  useState,
} from 'react';

import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { eventService } from '../services/eventService';

const PAGE_SIZE = 10;

const EVENT_STATUS = {
  1: {
    label: 'Novo',
    color: '#1D4ED8',
    background: '#DBEAFE',
    icon: 'time-outline',
  },
  2: {
    label: 'Recusado',
    color: '#B91C1C',
    background: '#FEE2E2',
    icon: 'close-circle-outline',
  },
  3: {
    label: 'Em reavaliação',
    color: '#C2410C',
    background: '#FFEDD5',
    icon: 'refresh-circle-outline',
  },
  4: {
    label: 'Aprovado',
    color: '#15803D',
    background: '#DCFCE7',
    icon: 'checkmark-circle-outline',
  },
};

function getEventStatus(status) {
  const names = {
    new: 1,
    refused: 2,
    reavaluate: 3,
    revaluate: 3,
    approved: 4,
  };

  const key =
    typeof status === 'string'
      ? names[status.toLowerCase()] ?? Number(status)
      : Number(status);

  return EVENT_STATUS[key] || {
    label: 'Desconhecido',
    color: '#64748B',
    background: '#F1F5F9',
    icon: 'help-circle-outline',
  };
}

function isRefused(status) {
  return (
    Number(status) === 2 ||
    String(status).toLowerCase() === 'refused'
  );
}

function getPhotoUri(photo) {
  if (!photo || typeof photo !== 'string') {
    return null;
  }

  const value = photo.trim();

  if (value.startsWith('data:image/')) {
    return value;
  }

  return `data:image/jpeg;base64,${value.replace(/\s/g, '')}`;
}

function EventCard({
  event,
  onRevaluate,
  revaluating,
}) {
  const photoUri = getPhotoUri(event.photo);
  const points = Number(event.points ?? 0);
  const status = getEventStatus(event.status);

  return (
    <View style={styles.card}>
      {photoUri ? (
        <Image
          source={{ uri: photoUri }}
          style={styles.photo}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.noPhoto}>
          <Ionicons
            name="image-outline"
            size={42}
            color="#94A3B8"
          />

          <Text style={styles.noPhotoText}>
            Foto indisponível
          </Text>
        </View>
      )}

      <View style={styles.cardContent}>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: status.background },
            ]}
          >
            <Ionicons
              name={status.icon}
              size={16}
              color={status.color}
            />

            <Text
              style={[
                styles.statusText,
                { color: status.color },
              ]}
            >
              {status.label}
            </Text>
          </View>
        </View>

        <Text style={styles.description}>
          {event.description || 'Sem descrição'}
        </Text>

        <View style={styles.pointsContainer}>
          <Ionicons
            name="trophy-outline"
            size={18}
            color="#203A6F"
          />

          <Text style={styles.pointsText}>
            {points.toLocaleString('pt-BR')} pontos
          </Text>
        </View>

        {isRefused(event.status) && (
          <View style={styles.revaluationContainer}>
            <Text style={styles.refusedMessage}>
              Este evento foi recusado. Você pode
              solicitar uma nova avaliação.
            </Text>

            <TouchableOpacity
              style={[
                styles.revaluationButton,
                revaluating && styles.disabledButton,
              ]}
              onPress={() => onRevaluate(event)}
              disabled={revaluating}
            >
              {revaluating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name="refresh-outline"
                    size={19}
                    color="#FFFFFF"
                  />

                  <Text style={styles.revaluationButtonText}>
                    Solicitar reavaliação
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {Number(event.status) === 3 && (
          <Text style={styles.pendingMessage}>
            Sua solicitação de reavaliação está pendente.
          </Text>
        )}
      </View>
    </View>
  );
}

export default function EventListScreen() {
  const [events, setEvents] = useState([]);
  const [pageIndex, setPageIndex] = useState(1);

  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [revaluatingId, setRevaluatingId] = useState(null);
  const revaluationInProgress = useRef(false);

  const loadEvents = useCallback(async (
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
      const data = await eventService.getPaginated(
        page,
        PAGE_SIZE
      );

      const items = Array.isArray(data?.itemsOnPage)
        ? data.itemsOnPage
        : [];

      const total = Number(data?.totalItems ?? 0);
      const size = Number(data?.pageSize ?? PAGE_SIZE);

      setEvents(items);
      setTotalItems(total);

      setTotalPages(
        Math.max(
          1,
          Math.ceil(total / (size || PAGE_SIZE))
        )
      );

      setPageIndex(page);
    } catch (err) {
      setError(
        err.message || 'Não foi possível carregar os eventos.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEvents(1);
    }, [loadEvents])
  );

  const handleRevaluate = (event) => {
    if (revaluationInProgress.current) return;

    Alert.alert(
      'Solicitar reavaliação',
      'Deseja solicitar uma nova avaliação deste evento?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Solicitar',
          onPress: async () => {
            if (revaluationInProgress.current) return;

            revaluationInProgress.current = true;
            setRevaluatingId(event.id);

            try {
              await eventService.revaluateEvent(event.id);

              // Atualização imediata da interface.
              setEvents(prev =>
                prev.map(item =>
                  item.id === event.id
                    ? { ...item, status: 3 }
                    : item
                )
              );

              Alert.alert(
                'Solicitação enviada',
                'Seu evento foi enviado para reavaliação.'
              );

              // Busca o status atualizado na API.
              await loadEvents(pageIndex, true);
            } catch (err) {
              Alert.alert(
                'Erro',
                err.message ||
                  'Não foi possível solicitar a reavaliação.'
              );
            } finally {
              revaluationInProgress.current = false;
              setRevaluatingId(null);
            }
          },
        },
      ]
    );
  };

  const handlePrevious = () => {
    if (pageIndex > 1 && !loading) {
      loadEvents(pageIndex - 1);
    }
  };

  const handleNext = () => {
    if (pageIndex < totalPages && !loading) {
      loadEvents(pageIndex + 1);
    }
  };

  if (loading && events.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#203A6F"
        />

        <Text style={styles.loadingText}>
          Carregando eventos...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onRevaluate={handleRevaluate}
            revaluating={revaluatingId === item.id}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadEvents(pageIndex, true)}
            colors={['#203A6F']}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>
              Meus eventos
            </Text>

            <Text style={styles.subtitle}>
              {totalItems} evento(s) encontrado(s)
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name={
                error
                  ? 'alert-circle-outline'
                  : 'images-outline'
              }
              size={52}
              color="#94A3B8"
            />

            <Text style={styles.emptyText}>
              {error || 'Nenhum evento encontrado.'}
            </Text>

            {error && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => loadEvents(pageIndex)}
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
                onPress={handlePrevious}
                disabled={pageIndex === 1 || loading}
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
                onPress={handleNext}
                disabled={pageIndex >= totalPages || loading}
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
  listContent: {
    padding: 16,
    paddingBottom: 35,
    flexGrow: 1,
  },
  header: {
    marginBottom: 22,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#000E35',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  photo: {
    width: '100%',
    height: 210,
    backgroundColor: '#E2E8F0',
  },
  noPhoto: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
  },
  noPhotoText: {
    color: '#64748B',
    marginTop: 8,
  },
  cardContent: {
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  description: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
    marginBottom: 14,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E8EDF7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 7,
  },
  pointsText: {
    color: '#203A6F',
    fontSize: 14,
    fontWeight: 'bold',
  },
  revaluationContainer: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  refusedMessage: {
    color: '#B91C1C',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  revaluationButton: {
    height: 46,
    borderRadius: 9,
    backgroundColor: '#203A6F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  revaluationButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  pendingMessage: {
    marginTop: 14,
    fontSize: 13,
    color: '#C2410C',
    fontWeight: '500',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 20,
  },
  pageButton: {
    backgroundColor: '#203A6F',
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
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
});
