import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { chatService } from '../../../services/chatService';

const WorkerChat = ({ navigation }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const flatListRef = useRef();

  useEffect(() => {
    loadUserChats();
  }, []);

  const loadUserChats = async () => {
    try {
      setLoading(true);
      const response = await chatService.getUserChats();
      if (response.success) {
        setChats(response.data.chats);
      }
    } catch (error) {
      console.error('Erreur chargement discussions:', error);
      Alert.alert('Erreur', 'Impossible de charger les discussions');
    } finally {
      setLoading(false);
    }
  };

  const loadChatMessages = async (chat) => {
    try {
      setMessagesLoading(true);
      setSelectedChat(chat);
      
      const response = await chatService.getRoomMessages(chat.room);
      if (response.success) {
        setMessages(response.data.messages);
        
        // Marquer comme lus
        await chatService.markMessagesAsRead(chat.room);
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
      Alert.alert('Erreur', 'Impossible de charger les messages');
    } finally {
      setMessagesLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const messageData = {
        content: newMessage.trim(),
        room: selectedChat.room,
        recipientId: getRecipientId(selectedChat),
        messageType: 'text'
      };

      const response = await chatService.sendMessage(messageData);
      if (response.success) {
        setNewMessage('');
        // Recharger les messages
        loadChatMessages(selectedChat);
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    }
  };

  const getRecipientId = (chat) => {
    if (!chat.lastMessage) return null;
    const lastMsg = chat.lastMessage;
    return lastMsg.senderId === user.id ? lastMsg.recipientId : lastMsg.senderId;
  };

  const getChatTitle = (chat) => {
    if (!chat.lastMessage) return 'Discussion';
    const lastMsg = chat.lastMessage;
    
    if (lastMsg.senderId === user.id) {
      return `${lastMsg.recipient?.firstName} ${lastMsg.recipient?.lastName}`;
    } else {
      return `${lastMsg.sender?.firstName} ${lastMsg.sender?.lastName}`;
    }
  };

  const getChatRole = (chat) => {
    if (!chat.lastMessage) return 'Utilisateur';
    const lastMsg = chat.lastMessage;
    
    if (lastMsg.senderId === user.id) {
      return lastMsg.recipient?.role || 'Utilisateur';
    } else {
      return lastMsg.sender?.role || 'Utilisateur';
    }
  };

  const getLastMessagePreview = (chat) => {
    if (!chat.lastMessage) return 'Aucun message';
    
    const content = chat.lastMessage.content;
    return content.length > 30 ? content.substring(0, 30) + '...' : content;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderChatItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.chatItem,
        selectedChat?.room === item.room && styles.selectedChat
      ]}
      onPress={() => loadChatMessages(item)}
    >
      <View style={styles.chatAvatar}>
        <Text style={styles.chatAvatarText}>
          {getChatTitle(item).charAt(0).toUpperCase()}
        </Text>
      </View>
      
      <View style={styles.chatInfo}>
        <Text style={styles.chatTitle}>{getChatTitle(item)}</Text>
        <Text style={styles.chatRole}>{getChatRole(item)}</Text>
        <Text style={styles.chatPreview} numberOfLines={1}>
          {getLastMessagePreview(item)}
        </Text>
      </View>
      
      <View style={styles.chatMeta}>
        <Text style={styles.chatTime}>
          {item.lastMessage && formatTime(item.lastMessage.createdAt)}
        </Text>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.senderId === user.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.messageTime,
            isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
          ]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
        {!isOwnMessage && (
          <Text style={styles.senderName}>
            {item.sender?.firstName} ({item.sender?.role})
          </Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Chargement des discussions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messagerie Employé</Text>
        <TouchableOpacity onPress={loadUserChats}>
          <Text style={styles.refreshButton}>🔄</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Liste des discussions */}
        <View style={styles.chatsList}>
          <Text style={styles.sectionTitle}>Discussions</Text>
          <FlatList
            data={chats}
            renderItem={renderChatItem}
            keyExtractor={(item) => item.room}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Zone de messages */}
        <View style={styles.messagesArea}>
          {selectedChat ? (
            <>
              <View style={styles.chatHeader}>
                <Text style={styles.chatHeaderTitle}>
                  {getChatTitle(selectedChat)}
                </Text>
                <Text style={styles.chatHeaderSubtitle}>
                  {getChatRole(selectedChat)}
                </Text>
              </View>

              {messagesLoading ? (
                <View style={styles.messagesLoading}>
                  <ActivityIndicator size="small" color="#3498db" />
                </View>
              ) : (
                <FlatList
                  ref={flatListRef}
                  data={messages}
                  renderItem={renderMessage}
                  keyExtractor={(item) => item.id.toString()}
                  style={styles.messagesList}
                  showsVerticalScrollIndicator={false}
                  onContentSizeChange={() => 
                    flatListRef.current?.scrollToEnd({ animated: true })
                  }
                />
              )}

              {/* Input d'envoi */}
              <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.inputContainer}
              >
                <TextInput
                  style={styles.messageInput}
                  value={newMessage}
                  onChangeText={setNewMessage}
                  placeholder="Tapez votre message..."
                  placeholderTextColor="#999"
                  multiline
                />
                <TouchableOpacity 
                  style={[
                    styles.sendButton,
                    !newMessage.trim() && styles.sendButtonDisabled
                  ]}
                  onPress={sendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Text style={styles.sendButtonText}>📤</Text>
                </TouchableOpacity>
              </KeyboardAvoidingView>
            </>
          ) : (
            <View style={styles.noChatSelected}>
              <Text style={styles.noChatText}>
                Sélectionnez une discussion pour commencer à chatter
              </Text>
              <Text style={styles.noChatSubtext}>
                Communiquez avec les administrateurs et autres employés
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    color: '#7f8c8d',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#3498db',
    borderBottomWidth: 1,
    borderBottomColor: '#2980b9',
  },
  backButton: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  refreshButton: {
    fontSize: 18,
    color: '#fff',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  chatsList: {
    width: '35%',
    borderRightWidth: 1,
    borderRightColor: '#ecf0f1',
    backgroundColor: '#fafafa',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    backgroundColor: '#fff',
  },
  selectedChat: {
    backgroundColor: '#e1f0fa',
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  chatInfo: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  chatRole: {
    fontSize: 11,
    color: '#3498db',
    marginBottom: 2,
    fontWeight: '600',
  },
  chatPreview: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  chatMeta: {
    alignItems: 'flex-end',
  },
  chatTime: {
    fontSize: 11,
    color: '#95a5a6',
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  messagesArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  chatHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    backgroundColor: '#f8f9fa',
  },
  chatHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  chatHeaderSubtitle: {
    fontSize: 12,
    color: '#3498db',
    marginTop: 2,
    fontWeight: '600',
  },
  messagesLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    flex: 1,
    padding: 15,
  },
  messageContainer: {
    marginBottom: 15,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 4,
  },
  ownBubble: {
    backgroundColor: '#3498db',
  },
  otherBubble: {
    backgroundColor: '#ecf0f1',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#2c3e50',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#95a5a6',
  },
  senderName: {
    fontSize: 11,
    color: '#7f8c8d',
    marginBottom: 2,
    marginLeft: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    backgroundColor: '#fff',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    marginRight: 10,
    backgroundColor: '#f8f9fa',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  noChatSelected: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noChatText: {
    textAlign: 'center',
    color: '#2c3e50',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  noChatSubtext: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: 14,
  },
});

export default WorkerChat;