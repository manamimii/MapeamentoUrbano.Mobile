import React, {
  useCallback,
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
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { eventService } from '../services/eventService';

const PAGE_SIZE = 10;

function getPhotoUri(photo) {
  if (!photo || typeof photo !== 'string') {
    return null;
  }

  const value = photo.trim();

  // Caso a API já retorne um Data URI.
  if (value.startsWith('data:image/')) {
    return value;
  }

  // Caso retorne apenas o Base64.
  return `data:image/jpeg;base64,${value.replace(/\s/g, '')}`;
}

function EventCard({ event }) {
  const photoUri = getPhotoUri(event.photo);

  const points = Number(event.points ?? 0);

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
        Math.max(1, Math.ceil(total / (size || PAGE_SIZE)))
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

  if (loading) {
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
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <EventCard event={item} />
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
              name={error ? 'alert-circle-outline' : 'images-outline'}
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
