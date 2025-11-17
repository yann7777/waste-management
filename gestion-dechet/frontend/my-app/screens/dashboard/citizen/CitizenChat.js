// CitizenChat.js
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

const CitizenChat = ({ navigation }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [showUserList, setShowUserList] = useState(false);
  const flatListRef = useRef();

  useEffect(() => {
    loadUserChats();
    loadChatUsers();
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

  const loadChatUsers = async () => {
    try {
      const response = await chatService.getChatUsers();
      if (response.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
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

  const startNewChat = async (recipient) => {
    try {
      const response = await chatService.createChat(recipient.id);
      if (response.success) {
        setShowUserList(false);
        // Recharger les discussions
        await loadUserChats();
        // Trouver et sélectionner la nouvelle discussion
        const newChat = {
          room: response.data.room,
          lastMessage: null,
          unreadCount: 0,
          updatedAt: new Date()
        };
        setSelectedChat(newChat);
        setMessages([]);
      }
    } catch (error) {
      console.error('Erreur création discussion:', error);
      Alert.alert('Erreur', 'Impossible de démarrer la discussion');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const recipientId = getRecipientId(selectedChat);
      if (!recipientId) {
        Alert.alert('Erreur', 'Impossible de déterminer le destinataire');
        return;
      }

      const messageData = {
        content: newMessage.trim(),
        room: selectedChat.room,
        recipientId: recipientId,
        messageType: 'text'
      };

      const response = await chatService.sendMessage(messageData);
      if (response.success) {
        setNewMessage('');
        // Recharger les messages
        loadChatMessages(selectedChat);
        // Recharger la liste des discussions pour mettre à jour le dernier message
        loadUserChats();
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    }
  };

  const getRecipientId = (chat) => {
    if (!chat.lastMessage) {
      // Pour une nouvelle discussion, extraire l'ID du destinataire depuis le room
      const roomParts = chat.room.split('_');
      const userIds = roomParts.slice(1).map(id => parseInt(id));
      return userIds.find(id => id !== user.id);
    }
    
    const lastMsg = chat.lastMessage;
    return lastMsg.senderId === user.id ? lastMsg.recipientId : lastMsg.senderId;
  };

  const getChatTitle = (chat) => {
    if (!chat.lastMessage) {
      // Pour une nouvelle discussion sans message
      const recipientId = getRecipientId(chat);
      const recipient = users.find(u => u.id === recipientId);
      return recipient ? `${recipient.firstName} ${recipient.lastName}` : 'Nouvelle discussion';
    }
    
    const lastMsg = chat.lastMessage;
    
    if (lastMsg.senderId === user.id) {
      return `${lastMsg.recipient?.firstName} ${lastMsg.recipient?.lastName}`;
    } else {
      return `${lastMsg.sender?.firstName} ${lastMsg.sender?.lastName}`;
    }
  };

  const getLastMessagePreview = (chat) => {
    if (!chat.lastMessage) return 'Démarrer la discussion';
    
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

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit'
      });
    }
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

  const renderUserItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => startNewChat(item)}
    >
      <View style={styles.userAvatar}>
        <Text style={styles.userAvatarText}>
          {item.firstName.charAt(0).toUpperCase()}
        </Text>
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={styles.userRole}>
          {item.role === 'admin' ? 'Administrateur' : 
           item.role === 'worker' ? 'Employé municipal' : 'Citoyen'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.senderId === user.id;
    const isSystemMessage = item.messageType === 'system';
    
    if (isSystemMessage) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.content}</Text>
        </View>
      );
    }
    
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
            {item.sender?.firstName}
          </Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#27ae60" />
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
        <Text style={styles.headerTitle}>Messagerie</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowUserList(!showUserList)}>
            <Text style={styles.headerButton}>👥</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={loadUserChats}>
            <Text style={styles.headerButton}>🔄</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {showUserList ? (
          /* Liste des utilisateurs pour nouvelle discussion */
          <View style={styles.usersSection}>
            <Text style={styles.sectionTitle}>Nouvelle Discussion</Text>
            <FlatList
              data={users}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
            />
          </View>
        ) : (
          /* Interface principale de chat */
          <>
            {/* Liste des discussions */}
            <View style={styles.chatsList}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Discussions</Text>
                <TouchableOpacity onPress={() => setShowUserList(true)}>
                  <Text style={styles.newChatButton}>+ Nouvelle</Text>
                </TouchableOpacity>
              </View>
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
                      {selectedChat.lastMessage?.sender?.role ? 
                       (selectedChat.lastMessage.sender.role === 'admin' ? 'Administrateur' :
                        selectedChat.lastMessage.sender.role === 'worker' ? 'Employé municipal' : 'Citoyen') : 
                       'Utilisateur'}
                    </Text>
                  </View>

                  {messagesLoading ? (
                    <View style={styles.messagesLoading}>
                      <ActivityIndicator size="small" color="#27ae60" />
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
                  <Text style={styles.noChatIcon}>💬</Text>
                  <Text style={styles.noChatTitle}>Bienvenue dans la messagerie</Text>
                  <Text style={styles.noChatText}>
                    Sélectionnez une discussion ou démarrez-en une nouvelle pour communiquer avec la communauté CleanCity
                  </Text>
                  <TouchableOpacity 
                    style={styles.startChatButton}
                    onPress={() => setShowUserList(true)}
                  >
                    <Text style={styles.startChatButtonText}>Démarrer une discussion</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}
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
    backgroundColor: '#27ae60',
    borderBottomWidth: 1,
    borderBottomColor: '#219a52',
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
  headerActions: {
    flexDirection: 'row',
    gap: 15,
  },
  headerButton: {
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  newChatButton: {
    color: '#27ae60',
    fontWeight: '600',
    fontSize: 12,
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
    backgroundColor: '#e8f5e8',
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#27ae60',
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
  usersSection: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    backgroundColor: '#fff',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#7f8c8d',
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
    color: '#7f8c8d',
    marginTop: 2,
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
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  systemMessageText: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic',
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
    backgroundColor: '#27ae60',
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
    backgroundColor: '#27ae60',
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
  noChatIcon: {
    fontSize: 50,
    marginBottom: 15,
  },
  noChatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  noChatText: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  startChatButton: {
    backgroundColor: '#27ae60',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  startChatButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default CitizenChat;