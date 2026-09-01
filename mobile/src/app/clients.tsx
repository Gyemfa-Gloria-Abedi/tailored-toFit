import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { Screen } from '../components';
import { colors } from '../theme';

import {
  Client,
  getClients,
  deleteClient,
} from '../api/clients';

export default function Clients() {
  const [clients, setClients] = useState<Client[]>(
    []
  );

  const [search, setSearch] = useState('');

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients(
    searchText = search
  ) {
    try {
      setLoading(true);

      const response =
        await getClients(
          searchText.trim() || undefined
        );

      setClients(response.clients);
    } catch (error) {
      console.error(
        'Failed to load clients:',
        error
      );

      Alert.alert(
        'Unable to load clients',
        error instanceof Error
          ? error.message
          : 'Something went wrong.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    try {
      setRefreshing(true);

      const response =
        await getClients(
          search.trim() || undefined
        );

      setClients(response.clients);
    } catch (error) {
      Alert.alert(
        'Unable to refresh',
        error instanceof Error
          ? error.message
          : 'Something went wrong.'
      );
    } finally {
      setRefreshing(false);
    }
  }

  function handleSearch(
    text: string
  ) {
    setSearch(text);

    loadClients(text);
  }

  function openClient(
    clientId: string
  ) {
    router.push(
      `/client/${clientId}` as any
    );
  }

  function editClient(
    clientId: string
  ) {
    router.push(
      `/edit-client/${clientId}` as any
    );
  }

  function confirmDelete(
    client: Client
  ) {
    Alert.alert(
      'Delete Client',
      `Are you sure you want to delete ${client.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            handleDelete(client.id),
        },
      ]
    );
  }

  async function handleDelete(
    clientId: string
  ) {
    try {
      await deleteClient(clientId);

      setClients((current) =>
        current.filter(
          (client) =>
            client.id !== clientId
        )
      );

      Alert.alert(
        'Client deleted',
        'The client was removed successfully.'
      );
    } catch (error) {
      console.error(
        'Failed to delete client:',
        error
      );

      Alert.alert(
        'Unable to delete client',
        error instanceof Error
          ? error.message
          : 'Something went wrong.'
      );
    }
  }

  function renderClient({
    item,
  }: {
    item: Client;
  }) {
    return (
      <View style={styles.card}>
        <Pressable
          style={styles.clientInfo}
          onPress={() =>
            openClient(item.id)
          }
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.name
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>

          <View style={styles.details}>
            <Text style={styles.name}>
              {item.name}
            </Text>

            {item.phone ? (
              <Text
                style={styles.secondary}
              >
                {item.phone}
              </Text>
            ) : null}

            {item.email ? (
              <Text
                style={styles.secondary}
              >
                {item.email}
              </Text>
            ) : null}
          </View>
        </Pressable>

        <View style={styles.actions}>
          <Pressable
            style={styles.editButton}
            onPress={() =>
              editClient(item.id)
            }
          >
            <Text
              style={styles.editText}
            >
              Edit
            </Text>
          </Pressable>

          <Pressable
            style={styles.deleteButton}
            onPress={() =>
              confirmDelete(item)
            }
          >
            <Text
              style={styles.deleteText}
            >
              Delete
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              Clients
            </Text>

            <Text
              style={styles.subtitle}
            >
              Manage your clients and measurements.
            </Text>
          </View>

          <Pressable
            style={styles.addButton}
            onPress={() =>
              router.push(
                '/add-client' as any
              )
            }
          >
            <Text
              style={styles.addButtonText}
            >
              + Add
            </Text>
          </Pressable>
        </View>

        <TextInput
          value={search}
          onChangeText={handleSearch}
          placeholder="Search clients..."
          placeholderTextColor={
            colors.muted
          }
          style={styles.search}
        />

        {loading ? (
          <View
            style={styles.loading}
          >
            <ActivityIndicator
              size="large"
              color={colors.purple}
            />

            <Text
              style={styles.loadingText}
            >
              Loading clients...
            </Text>
          </View>
        ) : (
          <FlatList
            data={clients}
            keyExtractor={(item) =>
              item.id
            }
            renderItem={renderClient}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            showsVerticalScrollIndicator={
              false
            }
            contentContainerStyle={
              clients.length === 0
                ? styles.emptyContainer
                : styles.list
            }
            ListEmptyComponent={
              <View
                style={styles.empty}
              >
                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  No clients found
                </Text>

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  Add your first client to get started.
                </Text>

                <Pressable
                  style={
                    styles.emptyButton
                  }
                  onPress={() =>
                    router.push(
                      '/add-client' as any
                    )
                  }
                >
                  <Text
                    style={
                      styles.emptyButtonText
                    }
                  >
                    Add Client
                  </Text>
                </Pressable>
              </View>
            }
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 18,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },

  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },

  subtitle: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 4,
  },

  addButton: {
    backgroundColor: colors.purple,
    borderRadius: 9,
    paddingHorizontal: 14,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },

  search: {
    height: 44,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 9,
    paddingHorizontal: 13,
    color: colors.text,
    fontSize: 11,
    marginBottom: 14,
  },

  list: {
    paddingBottom: 30,
  },

  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 12,
    marginBottom: 9,
  },

  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor:
      colors.softPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: colors.purple,
    fontSize: 15,
    fontWeight: '800',
  },

  details: {
    flex: 1,
    marginLeft: 11,
  },

  name: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },

  secondary: {
    color: colors.muted,
    fontSize: 9,
    marginTop: 3,
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 7,
    marginTop: 10,
  },

  editButton: {
    borderWidth: 1,
    borderColor: colors.purple,
    borderRadius: 7,
    paddingHorizontal: 12,
    minHeight: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },

  editText: {
    color: colors.purple,
    fontSize: 9,
    fontWeight: '800',
  },

  deleteButton: {
    borderWidth: 1,
    borderColor: '#D55',
    borderRadius: 7,
    paddingHorizontal: 12,
    minHeight: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteText: {
    color: '#C33',
    fontSize: 9,
    fontWeight: '800',
  },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 8,
  },

  emptyContainer: {
    flexGrow: 1,
  },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },

  emptyText: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 5,
    textAlign: 'center',
  },

  emptyButton: {
    marginTop: 16,
    backgroundColor: colors.purple,
    borderRadius: 8,
    paddingHorizontal: 18,
    minHeight: 40,
    justifyContent: 'center',
  },

  emptyButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
});