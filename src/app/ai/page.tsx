'use client';
import { useState, useRef, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { markdown } from '@/lib/markdown';
import { Textarea } from '@/components/ui/textarea';
import { useSession, signIn } from "next-auth/react";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

const models = [
  {
    value: 'gpt-4o',
    label: 'ChatGPT 4',
  },
  {
    value: 'chatgpt-4o-latest',
    label: 'ChatGPT 4 latest',
  },
  {
    value: 'gpt-4o-mini',
    label: 'ChatGPT 4 Mini',
  },
  {
    value: 'gpt-4-turbo',
    label: 'ChatGPT 4 Turbo',
  },
  {
    value: 'gpt-3.5-turbo',
    label: 'ChatGPT 3.5 Turbo',
  },
];

const formSchema = z.object({
  prompt: z.string().min(1, { message: 'Prompt cannot be empty' }),
});

export default function AI() {
  const { data: session, status } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const selectedModel = useRef(models[0].value);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  const createNewConversation = (): Conversation => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      model: selectedModel.current,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversation(newConversation);
    return newConversation;
  };

  const sendMessage = (prompt: string, conversation: Conversation) => {
    setLoading(true);
    
    const promptEncoded = encodeURI(prompt);
    fetch(
      `http://localhost:4000/gpt?prompt=${promptEncoded}&model=${selectedModel.current}`
    )
      .then(data => {
        data.json().then(d => {
          const content = d['choices'][0]['message']['content'];
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content,
            timestamp: new Date(),
          };

          const finalConversation = {
            ...conversation,
            messages: [...conversation.messages, assistantMessage],
            updatedAt: new Date(),
          };

          setCurrentConversation(finalConversation);
          setConversations(prev => 
            prev.map(conv => 
              conv.id === conversation.id ? finalConversation : conv
            )
          );
          setLoading(false);
        });
      })
      .catch(() => {
        setLoading(false);
        // Add error message
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        };
        const finalConversation = {
          ...conversation,
          messages: [...conversation.messages, errorMessage],
          updatedAt: new Date(),
        };
        setCurrentConversation(finalConversation);
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversation.id ? finalConversation : conv
          )
        );
      });
  };

  const updateConversationTitle = (conversationId: string, firstMessage: string) => {
    const title = firstMessage.length > 30 ? firstMessage.substring(0, 30) + '...' : firstMessage;
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, title, updatedAt: new Date() }
          : conv
      )
    );
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(prev => prev ? { ...prev, title, updatedAt: new Date() } : null);
    }
  };

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">Loading...</div>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-2 py-4 md:px-24">
        <div className="text-center pb-4">
          <h2 className="text-2xl font-bold mb-4">Login Required</h2>
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            onClick={() => signIn("discord")}
          >
            Login with Discord
          </button>
        </div>
      </main>
    );
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!currentConversation) {
      const newConversation = createNewConversation();
      // Use the new conversation directly instead of recursive call
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: values.prompt,
        timestamp: new Date(),
      };

      const updatedConversation = {
        ...newConversation,
        messages: [userMessage],
        updatedAt: new Date(),
      };

      updateConversationTitle(newConversation.id, values.prompt);
      setCurrentConversation(updatedConversation);
      setConversations(prev => 
        prev.map(conv => 
          conv.id === newConversation.id ? updatedConversation : conv
        )
      );

      form.reset();
      sendMessage(values.prompt, updatedConversation);
      return;
    }

    setLoading(true);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: values.prompt,
      timestamp: new Date(),
    };

    // Update conversation with user message
    const updatedConversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, userMessage],
      updatedAt: new Date(),
    };

    // Update title if this is the first message
    if (currentConversation.messages.length === 0) {
      updateConversationTitle(currentConversation.id, values.prompt);
    }

    setCurrentConversation(updatedConversation);
    setConversations(prev => 
      prev.map(conv => 
        conv.id === currentConversation.id ? updatedConversation : conv
      )
    );

    form.reset();
    sendMessage(values.prompt, updatedConversation);
  }

  return (
    <main className="flex h-screen bg-background">
      {/* Sidebar - Conversations */}
      <div className="w-80 border-r bg-muted/30 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <Button 
            onClick={createNewConversation}
            className="w-full"
            size="sm"
          >
            + New Chat
          </Button>
        </div>

        {/* Model Selector */}
        <div className="p-4 border-b">
          <Combobox
            values={models}
            placeholder='Select a model'
            emptyValue='No model found.'
            defaultValue={models[0].value}
            selectedValue={selectedModel}
          />
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <p>No conversations yet</p>
              <p className="text-sm">Start a new chat to begin</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setCurrentConversation(conversation)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    currentConversation?.id === conversation.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="font-medium truncate">{conversation.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {conversation.updatedAt.toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b">
          <h1 className="text-xl font-semibold">
            {currentConversation?.title || 'New Chat'}
          </h1>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!currentConversation ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <div className="text-4xl mb-4">🤖</div>
                <h2 className="text-2xl font-semibold mb-2">Welcome to AI Chat</h2>
                <p>Start a new conversation to begin chatting with AI</p>
              </div>
            </div>
          ) : (
            <>
              {currentConversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: markdown.render(message.content) 
                        }}
                      />
                    ) : (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    )}
                    <div className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm text-muted-foreground">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex gap-2">
                        <Textarea
                          className="flex-1 resize-none"
                          placeholder="Type your message..."
                          rows={1}
                          {...field}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              form.handleSubmit(onSubmit)();
                            }
                          }}
                        />
                        <Button
                          type="submit"
                          disabled={!form.formState.isValid || loading}
                          size="sm"
                        >
                          {loading ? '...' : 'Send'}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
      </div>
    </main>
  );
}
