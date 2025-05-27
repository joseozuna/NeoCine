// src/screens/ChatScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  createdAt: number;
  isMine: boolean;          // true = mensaje propio, false = del interlocutor
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  /** Añade un mensaje “propio” a la lista */
  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      text: trimmed,
      createdAt: Date.now(),
      isMine: true,
    };

    setMessages((prev) => [newMsg, ...prev]);
    setInput('');
  };

  /** Auto‑scroll al último mensaje (la FlatList está invertida) */
  useEffect(() => {
    if (messages.length) {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  }, [messages]);

  /** Burbuja individual */
  const renderItem = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.bubble,
        item.isMine ? styles.bubbleMine : styles.bubbleOther,
      ]}
    >
      <Text style={styles.bubbleText}>{item.text}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      {/* Lista de mensajes: invertida para que el último quede abajo */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        inverted            // ¡clave para “whatsapp‑style”!
        contentContainerStyle={styles.list}
      />

      {/* Barra de escritura */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Escribe un mensaje…"
          placeholderTextColor="#888"
          multiline
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  list: { paddingHorizontal: 12, paddingVertical: 4 },
  /* Burbujas --------------------------------------- */
  bubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 12,
    marginVertical: 4,
  },
  bubbleMine: {
    backgroundColor: '#5E5CE6',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 0,
  },
  bubbleOther: {
    backgroundColor: '#1a1a1a',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 0,
  },
  bubbleText: { color: '#fff', fontSize: 15, lineHeight: 20 },
  /* Barra de entrada ------------------------------- */
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#222',
    backgroundColor: '#121212',
  },
  input: {
    flex: 1,
    maxHeight: 96,
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 8,
  },
  sendBtn: {
    padding: 8,
    backgroundColor: '#5E5CE6',
    borderRadius: 20,
    marginLeft: 6,
  },
});
