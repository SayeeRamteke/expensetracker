import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const STORAGE_KEY = '@paisa-diary-v2';

const COLORS = {
  background: '#FFF1DE',
  paper: '#FFF8EC',
  paperDeep: '#FBE8D0',
  ink: '#42291F',
  muted: '#9C7A68',
  line: '#F0D7BE',
  peach: '#FFB783',
  peachDeep: '#E9925F',
  orange: '#F3A51C',
  mint: '#78CDB8',
  mintDark: '#389C87',
  mintLight: '#E0F5E9',
  pink: '#F6B7C6',
  pinkLight: '#FCE4E8',
  red: '#D96E68',
  redLight: '#FBE8E1',
  white: '#FFFFFF',
  yellow: '#FFE8A8',
  lavender: '#E7DDF8',
};

const CATEGORIES = [
  { name: 'Food', icon: 'fast-food-outline', color: '#E99A38' },
  { name: 'Travel', icon: 'train-outline', color: '#4D8DCE' },
  { name: 'Shopping', icon: 'bag-handle-outline', color: '#AA83C8' },
  { name: 'Bills', icon: 'receipt-outline', color: '#D96E68' },
  { name: 'Health', icon: 'heart-outline', color: '#53AD91' },
  { name: 'Education', icon: 'book-outline', color: '#579DBD' },
  { name: 'Fun', icon: 'game-controller-outline', color: '#D87CA5' },
  { name: 'Salary', icon: 'wallet-outline', color: '#389C87' },
  { name: 'Gift', icon: 'gift-outline', color: '#D87CA5' },
  { name: 'Other', icon: 'sparkles-outline', color: '#A58B78' },
];

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const monthKey = (date) => String(date || '').slice(0, 7);
const money = (value) => `₹${Math.abs(Number(value || 0)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const categoryFor = (name) => CATEGORIES.find((c) => c.name === name) || CATEGORIES[CATEGORIES.length - 1];
const dateLabel = (date) => {
  if (!date) return 'Today';
  const d = new Date(`${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  const now = today();
  if (date === now) return 'Today';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

function Icon({ name, size = 20, color = COLORS.ink }) {
  return <Ionicons name={name} size={size} color={color} />;
}

function Doodle({ type = 'bunny', style }) {
  // Small, English-language-friendly sticker illustrations drawn with native views.
  if (type === 'star') {
    return <View style={[styles.doodleStar, style]}><Text style={styles.doodleStarText}>✦</Text></View>;
  }
  if (type === 'flower') {
    return <View style={[styles.flowerDoodle, style]}><Text style={styles.flowerText}>✿</Text></View>;
  }
  return (
    <View style={[styles.bunnySticker, style]}>
      <View style={styles.bunnyEarLeft} />
      <View style={styles.bunnyEarRight} />
      <View style={styles.bunnyFace}>
        <View style={styles.bunnyEyes}><View /><View /></View>
        <View style={styles.bunnyCheeks}><View /><View /></View>
        <Text style={styles.bunnyNose}>⌣</Text>
      </View>
      <View style={styles.bunnyBody} />
    </View>
  );
}

function SectionHeading({ title, action, onAction }) {
  return (
    <View style={styles.sectionHeadingRow}>
      <Text style={styles.sectionHeading}>{title}</Text>
      {action ? <TouchableOpacity onPress={onAction}><Text style={styles.sectionAction}>{action}</Text></TouchableOpacity> : null}
    </View>
  );
}

function MiniSummary({ title, amount, type }) {
  const income = type === 'income';
  return (
    <View style={styles.miniSummary}>
      <View style={[styles.miniIcon, { backgroundColor: income ? COLORS.mintLight : COLORS.pinkLight }]}>
        <Icon name={income ? 'arrow-down-outline' : 'arrow-up-outline'} size={17} color={income ? COLORS.mintDark : COLORS.red} />
      </View>
      <Text style={styles.miniTitle}>{title}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.miniAmount, { color: income ? COLORS.mintDark : COLORS.red }]}>
        {money(amount)}
      </Text>
    </View>
  );
}

function TransactionRow({ item, onEdit, onDelete }) {
  const category = categoryFor(item.category);
  const isIncome = item.type === 'income';
  return (
    <TouchableOpacity activeOpacity={0.86} onPress={() => onEdit(item)} style={styles.transactionRow}>
      <View style={[styles.transactionIcon, { backgroundColor: `${category.color}20` }]}>
        <Icon name={category.icon} size={21} color={category.color} />
      </View>
      <View style={styles.transactionMain}>
        <Text numberOfLines={1} style={styles.transactionTitle}>{item.title}</Text>
        <Text style={styles.transactionSub}>{item.category}  ·  {dateLabel(item.date)}</Text>
      </View>
      <View style={styles.transactionAmountArea}>
        <Text style={[styles.transactionAmount, { color: isIncome ? COLORS.mintDark : COLORS.ink }]}>
          {isIncome ? '+' : '−'}{money(item.amount)}
        </Text>
        <TouchableOpacity onPress={() => onDelete(item)} hitSlop={10} style={styles.moreButton}>
          <Icon name="ellipsis-horizontal" size={18} color={COLORS.muted} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ title = 'Your diary is waiting!', detail = 'Add your first entry and watch your money story grow.' }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptySticker}><Doodle type="bunny" /></View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{detail}</Text>
    </View>
  );
}

function CategoryPicker({ type, selected, onSelect }) {
  const available = CATEGORIES.filter((c) => type === 'income'
    ? ['Salary', 'Gift', 'Other', 'Education'].includes(c.name)
    : c.name !== 'Salary');
  return (
    <View style={styles.categoryGrid}>
      {available.map((cat) => {
        const active = selected === cat.name;
        return (
          <TouchableOpacity
            key={cat.name}
            onPress={() => onSelect(cat.name)}
            style={[styles.categoryOption, active && { borderColor: cat.color, backgroundColor: `${cat.color}18` }]}
          >
            <Icon name={cat.icon} size={17} color={cat.color} />
            <Text style={[styles.categoryOptionText, active && { color: cat.color, fontWeight: '800' }]}>{cat.name}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function TransactionModal({ visible, initial, onClose, onSave }) {
  const [type, setType] = useState('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!visible) return;
    setType(initial?.type || 'expense');
    setTitle(initial?.title || '');
    setAmount(initial ? String(initial.amount) : '');
    setCategory(initial?.category || (initial?.type === 'income' ? 'Salary' : 'Food'));
    setDate(initial?.date || today());
    setNote(initial?.note || '');
  }, [visible, initial]);

  const submit = () => {
    const cleanTitle = title.trim();
    const numericAmount = Number(amount);
    if (!cleanTitle) {
      Alert.alert('Add a title', 'Give this little money story a name.');
      return;
    }
    if (!amount.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      Alert.alert('Check the amount', 'Please enter an amount greater than zero.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(`${date}T12:00:00`).getTime())) {
      Alert.alert('Check the date', 'Please use the date format YYYY-MM-DD.');
      return;
    }
    onSave({
      ...(initial || {}),
      id: initial?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: cleanTitle,
      amount: Math.round(numericAmount * 100) / 100,
      type,
      category,
      date,
      note: note.trim(),
      createdAt: initial?.createdAt || new Date().toISOString(),
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}><Icon name="close" size={20} /></TouchableOpacity>
            <Text style={styles.modalTitle}>{initial ? 'Edit your entry' : 'A new money story'}</Text>
            <Doodle type="flower" style={{ marginRight: 3 }} />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalContent}>
            <View style={styles.typeSwitch}>
              <TouchableOpacity onPress={() => { setType('expense'); if (category === 'Salary') setCategory('Food'); }} style={[styles.typeChoice, type === 'expense' && styles.typeChoiceExpense]}>
                <Icon name="heart-outline" color={type === 'expense' ? COLORS.red : COLORS.muted} size={18} />
                <Text style={[styles.typeChoiceText, type === 'expense' && { color: COLORS.red }]}>I spent</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setType('income'); setCategory('Salary'); }} style={[styles.typeChoice, type === 'income' && styles.typeChoiceIncome]}>
                <Icon name="sparkles-outline" color={type === 'income' ? COLORS.mintDark : COLORS.muted} size={18} />
                <Text style={[styles.typeChoiceText, type === 'income' && { color: COLORS.mintDark }]}>I received</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>HOW MUCH? ♡</Text>
            <View style={styles.amountInputWrap}>
              <Text style={styles.rupeeSymbol}>₹</Text>
              <TextInput value={amount} onChangeText={setAmount} placeholder="0" keyboardType="decimal-pad" style={styles.amountInput} />
            </View>

            <Text style={styles.fieldLabel}>GIVE IT A NAME</Text>
            <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Coffee with a friend" style={styles.textInput} maxLength={70} />

            <Text style={styles.fieldLabel}>PICK A CATEGORY</Text>
            <CategoryPicker type={type} selected={category} onSelect={setCategory} />

            <Text style={styles.fieldLabel}>WHEN WAS IT? (YYYY-MM-DD)</Text>
            <TextInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" style={styles.textInput} autoCapitalize="none" />

            <Text style={styles.fieldLabel}>A LITTLE NOTE (OPTIONAL)</Text>
            <TextInput value={note} onChangeText={setNote} placeholder="Anything you want to remember..." style={[styles.textInput, styles.noteInput]} multiline maxLength={180} />

            <TouchableOpacity onPress={submit} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>{initial ? 'Save my changes' : 'Save my entry ♡'}</Text>
              <Icon name="heart" size={17} color={COLORS.ink} />
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function HomeScreen({ transactions, balance, income, expenses, onAdd, onEdit, onDelete, onSeeAll }) {
  const thisMonth = today().slice(0, 7);
  const monthEntries = transactions.filter((t) => monthKey(t.date) === thisMonth);
  const monthIncome = monthEntries.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const monthSpent = monthEntries.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const savingsRate = monthIncome ? Math.max(0, Math.min(100, ((monthIncome - monthSpent) / monthIncome) * 100)) : 0;
  const recent = [...transactions].sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 5);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.screenContent}>
      <View style={styles.greetingRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>A LITTLE CHECK-IN ✿</Text>
          <Text style={styles.greeting}>Hello, money pal!</Text>
          <Text style={styles.greetingSub}>Tiny steps make happy savings.</Text>
        </View>
        <TouchableOpacity onPress={onAdd} style={styles.addButton}><Icon name="add" size={26} color={COLORS.ink} /></TouchableOpacity>
      </View>

      <View style={styles.balanceCard}>
        <View style={styles.balanceCardTop}>
          <Text style={styles.balanceLabel}>MY LITTLE BALANCE</Text>
          <View style={styles.balanceBadge}><View style={styles.balanceDot} /><Text style={styles.balanceBadgeText}>looking lovely</Text></View>
        </View>
        <Text style={styles.balanceAmount}>{balance < 0 ? '−' : ''}{money(balance)}</Text>
        <Text style={styles.balanceDescription}>Your little money world, all in one place.</Text>
        <View style={styles.balanceDivider} />
        <View style={styles.balanceStats}>
          <View><Text style={styles.balanceLabel}>INCOME ♡</Text><Text style={styles.balanceStat}>↙ {money(income)}</Text></View>
          <View style={styles.balanceStatDivider} />
          <View><Text style={styles.balanceLabel}>SPENT ♡</Text><Text style={styles.balanceStat}>↗ {money(expenses)}</Text></View>
        </View>
        <Doodle type="flower" style={styles.balanceFlower} />
        <Doodle type="star" style={styles.balanceStar} />
      </View>

      <View style={styles.summaryRow}>
        <MiniSummary title="Income this month" amount={monthIncome} type="income" />
        <MiniSummary title="Spent this month" amount={monthSpent} type="expense" />
      </View>

      <View style={styles.savingsCard}>
        <View style={styles.savingsTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.savingsTitle}>My saving garden</Text>
            <Text style={styles.savingsSub}>A little progress goes a long way.</Text>
          </View>
          <Text style={styles.savingsEmoji}>🌱</Text>
        </View>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${savingsRate}%` }]} /></View>
        <View style={styles.savingsBottom}>
          <Text style={styles.savingsHint}>{monthIncome ? `${money(monthIncome - monthSpent)} left after expenses` : 'Add income to grow your savings garden.'}</Text>
          <Text style={styles.savingsPercent}>{Math.round(savingsRate)}%</Text>
        </View>
      </View>

      <SectionHeading title="Little money stories" action="See all" onAction={onSeeAll} />
      {recent.length ? recent.map((item) => <TransactionRow key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />) : <EmptyState />}
      <TouchableOpacity onPress={onAdd} style={styles.firstEntryButton}>
        <Icon name="add-circle-outline" size={19} color={COLORS.peachDeep} />
        <Text style={styles.firstEntryText}>Add a little money story</Text>
        <Text style={styles.firstEntryHeart}>♡</Text>
      </TouchableOpacity>
      <Text style={styles.footerNote}>Made with a little love and a lot of care ♡</Text>
    </ScrollView>
  );
}

function TransactionsScreen({ transactions, onEdit, onDelete, onAdd }) {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const visible = useMemo(() => transactions.filter((t) => {
    const typeMatches = filter === 'All' || (filter === 'Income' ? t.type === 'income' : t.type === 'expense');
    const q = search.trim().toLowerCase();
    return typeMatches && (!q || `${t.title} ${t.category} ${t.note || ''}`.toLowerCase().includes(q));
  }).sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || '')), [transactions, filter, search]);

  return (
    <View style={styles.screenContent}>
      <Text style={styles.pageTitle}>My money diary ♡</Text>
      <Text style={styles.pageSubtitle}>Every little moment, in one place.</Text>
      <View style={styles.searchBox}><Icon name="search-outline" size={19} color={COLORS.muted} /><TextInput value={search} onChangeText={setSearch} placeholder="Search your entries..." style={styles.searchInput} />{search ? <TouchableOpacity onPress={() => setSearch('')}><Icon name="close-circle" color={COLORS.muted} /></TouchableOpacity> : null}</View>
      <View style={styles.filterRow}>{['All', 'Income', 'Expense'].map((f) => <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.filterPill, filter === f && styles.filterPillActive]}><Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text></TouchableOpacity>)}</View>
      <Text style={styles.resultCount}>{visible.length} little {visible.length === 1 ? 'entry' : 'entries'}</Text>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TransactionRow item={item} onEdit={onEdit} onDelete={onDelete} />}
        ListEmptyComponent={<EmptyState title="No entries found" detail="Try another search, or add a new money story." />}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      />
      <TouchableOpacity onPress={onAdd} style={styles.floatingAdd}><Icon name="add" size={22} color={COLORS.ink} /><Text style={styles.floatingAddText}>Add an entry</Text></TouchableOpacity>
    </View>
  );
}

function AnalyticsScreen({ transactions }) {
  const [period, setPeriod] = useState('This month');
  const currentMonth = today().slice(0, 7);
  const entries = transactions.filter((t) => period === 'All time' || monthKey(t.date) === currentMonth);
  const expenses = entries.filter((t) => t.type === 'expense');
  const income = entries.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const spent = expenses.reduce((sum, t) => sum + t.amount, 0);
  const groups = Object.entries(expenses.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {})).sort((a, b) => b[1] - a[1]);
  const maxValue = Math.max(1, ...groups.map((g) => g[1]));

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.screenContent}>
      <Text style={styles.pageTitle}>My little insights</Text>
      <Text style={styles.pageSubtitle}>Your spending, told softly.</Text>
      <View style={styles.filterRow}>{['This month', 'All time'].map((p) => <TouchableOpacity key={p} onPress={() => setPeriod(p)} style={[styles.filterPill, period === p && styles.filterPillActive]}><Text style={[styles.filterText, period === p && styles.filterTextActive]}>{p}</Text></TouchableOpacity>)}</View>
      <View style={styles.analyticsCard}>
        <Text style={styles.balanceLabel}>TOTAL SPENT</Text>
        <Text style={styles.analyticsAmount}>{money(spent)}</Text>
        <View style={styles.analyticsDivider} />
        <View style={styles.analyticsTotals}>
          <View><Text style={styles.analyticsLabel}>INCOME</Text><Text style={styles.analyticsIncome}>{money(income)}</Text></View>
          <View><Text style={styles.analyticsLabel}>LEFT OVER</Text><Text style={styles.analyticsWhite}>{income - spent < 0 ? '−' : ''}{money(income - spent)}</Text></View>
        </View>
        <Doodle type="flower" style={styles.analyticsFlower} />
      </View>
      <View style={styles.whiteCard}>
        <SectionHeading title="Spending by category" />
        {groups.length ? groups.map(([name, value]) => {
          const category = categoryFor(name);
          return (
            <View key={name} style={styles.categoryBarGroup}>
              <View style={styles.categoryBarTop}>
                <View style={styles.categoryBarName}><Icon name={category.icon} size={17} color={category.color} /><Text style={styles.categoryBarTitle}>{name}</Text></View>
                <Text style={styles.categoryBarAmount}>{money(value)}</Text>
              </View>
              <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${(value / maxValue) * 100}%`, backgroundColor: category.color }]} /></View>
              <Text style={styles.categoryPercent}>{spent ? Math.round(value / spent * 100) : 0}% of spending</Text>
            </View>
          );
        }) : <EmptyState title="Your chart will bloom here" detail="Add a few expenses to see your spending patterns." />}
      </View>
      <View style={styles.insightBox}>
        <Doodle type="star" />
        <View style={{ flex: 1 }}>
          <Text style={styles.insightTitle}>A tiny insight</Text>
          <Text style={styles.insightText}>{groups.length ? `${groups[0][0]} is your biggest spending category at ${money(groups[0][1])}. Keep it in mind when planning your next month.` : 'Start adding expenses and your little insights will appear here.'}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function BudgetsScreen({ transactions, budgets, onSetBudget }) {
  const [drafts, setDrafts] = useState({});
  const currentMonth = today().slice(0, 7);
  const expenses = transactions.filter((t) => t.type === 'expense' && monthKey(t.date) === currentMonth);
  const totalBudget = Object.values(budgets).reduce((sum, v) => sum + Number(v || 0), 0);
  const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.screenContent}>
      <Text style={styles.pageTitle}>Gentle budgets</Text>
      <Text style={styles.pageSubtitle}>Little goals, no guilt.</Text>
      <View style={styles.budgetHero}>
        <Text style={styles.balanceLabel}>MY MONTHLY PLAN</Text>
        <Text style={styles.budgetHeroAmount}>{money(totalBudget)}</Text>
        <View style={styles.budgetHeroMeta}><Text style={styles.budgetHeroSmall}>Spent {money(totalSpent)}</Text><Text style={styles.budgetHeroSmall}>{totalBudget ? `${Math.round(totalSpent / totalBudget * 100)}% used` : 'Set your first limit'}</Text></View>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.min(100, totalBudget ? totalSpent / totalBudget * 100 : 0)}%`, backgroundColor: totalBudget && totalSpent > totalBudget ? COLORS.red : COLORS.yellow }]} /></View>
      </View>
      <SectionHeading title="Category limits" />
      {CATEGORIES.filter((c) => c.name !== 'Salary').map((category) => {
        const spent = expenses.filter((t) => t.category === category.name).reduce((sum, t) => sum + t.amount, 0);
        const limit = Number(budgets[category.name] || 0);
        const ratio = limit ? spent / limit : 0;
        const draft = drafts[category.name] ?? (budgets[category.name] ? String(budgets[category.name]) : '');
        return (
          <View key={category.name} style={styles.budgetRow}>
            <View style={[styles.transactionIcon, { backgroundColor: `${category.color}20` }]}><Icon name={category.icon} size={20} color={category.color} /></View>
            <View style={styles.budgetDetails}>
              <View style={styles.categoryBarTop}><Text style={styles.transactionTitle}>{category.name}</Text><Text style={styles.budgetSpent}>{money(spent)}{limit ? ` / ${money(limit)}` : ''}</Text></View>
              <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.min(100, ratio * 100)}%`, backgroundColor: ratio > 1 ? COLORS.red : category.color }]} /></View>
              {ratio > 1 ? <Text style={styles.overBudget}>Over your limit by {money(spent - limit)}</Text> : null}
              <View style={styles.budgetInputRow}>
                <TextInput value={draft} onChangeText={(value) => setDrafts((old) => ({ ...old, [category.name]: value }))} placeholder="Monthly limit (₹)" keyboardType="decimal-pad" style={styles.budgetInput} />
                <TouchableOpacity onPress={() => {
                  const raw = String(draft).trim();
                  if (raw && (!Number.isFinite(Number(raw)) || Number(raw) < 0)) {
                    Alert.alert('Check the limit', 'Enter a valid non-negative amount.');
                    return;
                  }
                  onSetBudget(category.name, raw ? Number(raw) : 0);
                }} style={styles.budgetSave}><Text style={styles.budgetSaveText}>Save</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })}
      <Text style={styles.footerNote}>These are friendly planning tools, not bank limits. ♡</Text>
    </ScrollView>
  );
}

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('Home');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setTransactions(Array.isArray(parsed.transactions) ? parsed.transactions : []);
          setBudgets(parsed.budgets && typeof parsed.budgets === 'object' ? parsed.budgets : {});
        }
      } catch (error) {
        Alert.alert('Could not load saved entries', 'You can keep using the app, but older saved data may be unavailable.');
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ transactions, budgets })).catch(() => {
      Alert.alert('Could not save', 'Your latest changes may not remain after closing the app.');
    });
  }, [transactions, budgets, loaded]);

  const income = useMemo(() => transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0), [transactions]);
  const expenses = useMemo(() => transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0), [transactions]);
  const balance = income - expenses;

  const openAdd = () => { setEditingItem(null); setModalVisible(true); };
  const openEdit = (item) => { setEditingItem(item); setModalVisible(true); };
  const saveTransaction = (item) => {
    setTransactions((old) => editingItem ? old.map((t) => t.id === item.id ? item : t) : [item, ...old]);
    setModalVisible(false);
    setEditingItem(null);
  };
  const deleteTransaction = (item) => Alert.alert('Remove this entry?', `Delete "${item.title}" (${money(item.amount)})?`, [
    { text: 'Keep it', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => setTransactions((old) => old.filter((t) => t.id !== item.id)) },
  ]);
  const setBudget = (category, amount) => {
    setBudgets((old) => {
      const next = { ...old };
      if (!amount) delete next[category];
      else next[category] = amount;
      return next;
    });
    Alert.alert('Saved with love ♡', amount ? `${category} limit is now ${money(amount)}.` : `${category} limit removed.`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      {!loaded ? (
        <View style={styles.loadingScreen}>
          <View style={styles.loadingLogo}><Icon name="heart" size={24} color={COLORS.ink} /></View>
          <Text style={styles.loadingTitle}>Paisa Diary</Text>
          <Text style={styles.loadingSubtitle}>Getting your little world ready...</Text>
        </View>
      ) : (
        <>
          <View style={styles.appHeader}>
            <View style={styles.appLogo}><Icon name="wallet-outline" size={21} color={COLORS.ink} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.appName}>Paisa Diary ♡</Text>
              <Text style={styles.appTagline}>YOUR LITTLE MONEY JOURNAL</Text>
            </View>
            <TouchableOpacity onPress={() => Alert.alert('Your diary is private', 'Your entries and budgets are saved locally on this device. No bank account or online account is connected.')} style={styles.privacyButton}>
              <Icon name="lock-closed-outline" size={19} color={COLORS.ink} />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            {activeTab === 'Home' ? (
              <HomeScreen transactions={transactions} balance={balance} income={income} expenses={expenses} onAdd={openAdd} onEdit={openEdit} onDelete={deleteTransaction} onSeeAll={() => setActiveTab('Transactions')} />
            ) : activeTab === 'Transactions' ? (
              <TransactionsScreen transactions={transactions} onEdit={openEdit} onDelete={deleteTransaction} onAdd={openAdd} />
            ) : activeTab === 'Analytics' ? (
              <AnalyticsScreen transactions={transactions} />
            ) : (
              <BudgetsScreen transactions={transactions} budgets={budgets} onSetBudget={setBudget} />
            )}
          </View>

          <View style={styles.bottomNav}>
            {[
              ['Home', 'home-outline', 'home'],
              ['Diary', 'book-outline', 'book'],
              ['Insights', 'pie-chart-outline', 'pie-chart'],
              ['Budgets', 'leaf-outline', 'leaf'],
            ].map(([label, icon, activeIcon]) => {
              const selected = (label === 'Diary' ? activeTab === 'Transactions' : label === 'Insights' ? activeTab === 'Analytics' : activeTab === label);
              const target = label === 'Diary' ? 'Transactions' : label === 'Insights' ? 'Analytics' : label;
              return (
                <TouchableOpacity key={label} onPress={() => setActiveTab(target)} style={styles.navItem}>
                  <View style={[styles.navIconWrap, selected && styles.navIconSelected]}><Icon name={selected ? activeIcon : icon} size={20} color={selected ? COLORS.mintDark : COLORS.muted} /></View>
                  <Text style={[styles.navLabel, selected && styles.navLabelSelected]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TransactionModal visible={modalVisible} initial={editingItem} onClose={() => { setModalVisible(false); setEditingItem(null); }} onSave={saveTransaction} />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0 },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  loadingLogo: { width: 62, height: 62, borderRadius: 24, backgroundColor: COLORS.peach, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  loadingTitle: { color: COLORS.ink, fontSize: 25, fontWeight: '900' },
  loadingSubtitle: { color: COLORS.muted, fontSize: 12, marginTop: 6 },
  appHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 19, paddingTop: 7, paddingBottom: 10, gap: 10 },
  appLogo: { width: 42, height: 42, borderRadius: 15, backgroundColor: COLORS.peach, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F0A776' },
  appName: { color: COLORS.ink, fontSize: 19, fontWeight: '900', letterSpacing: -0.5 },
  appTagline: { color: COLORS.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1.1, marginTop: 2 },
  privacyButton: { width: 39, height: 39, borderRadius: 14, backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.line, alignItems: 'center', justifyContent: 'center' },
  screenContent: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 25, flexGrow: 1 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8 },
  eyebrow: { color: COLORS.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.4, marginBottom: 4 },
  greeting: { color: COLORS.ink, fontSize: 24, fontWeight: '900', letterSpacing: -0.8 },
  greetingSub: { color: COLORS.muted, fontSize: 11, marginTop: 5 },
  addButton: { width: 45, height: 45, borderRadius: 17, backgroundColor: COLORS.orange, borderWidth: 1, borderColor: '#E5A02A', alignItems: 'center', justifyContent: 'center' },
  balanceCard: { backgroundColor: COLORS.mint, borderRadius: 27, padding: 20, overflow: 'hidden', marginBottom: 13, borderWidth: 1, borderColor: '#63BDA8' },
  balanceCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  balanceLabel: { color: '#285E52', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  balanceBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFFFFF75', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 9 },
  balanceDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.mintDark },
  balanceBadgeText: { color: '#285E52', fontSize: 9, fontWeight: '800' },
  balanceAmount: { color: '#FFFFFF', fontSize: 34, fontWeight: '900', letterSpacing: -1, marginTop: 13 },
  balanceDescription: { color: '#2C6C5D', fontSize: 10, marginTop: 4 },
  balanceDivider: { height: 1, backgroundColor: '#FFFFFF80', marginVertical: 16 },
  balanceStats: { flexDirection: 'row', alignItems: 'center', gap: 22 },
  balanceStat: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', marginTop: 6 },
  balanceStatDivider: { width: 1, height: 32, backgroundColor: '#FFFFFF80' },
  balanceFlower: { position: 'absolute', right: 16, top: 42, opacity: 0.22 },
  balanceStar: { position: 'absolute', right: 60, bottom: 28, opacity: 0.35 },
  miniSummary: { flex: 1, backgroundColor: COLORS.paper, borderRadius: 20, padding: 13, borderWidth: 1, borderColor: COLORS.line },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 13 },
  miniIcon: { width: 31, height: 31, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 9 },
  miniTitle: { color: COLORS.muted, fontSize: 9, fontWeight: '700', marginBottom: 5 },
  miniAmount: { fontSize: 16, fontWeight: '900', letterSpacing: -0.4 },
  savingsCard: { backgroundColor: COLORS.paper, borderRadius: 20, borderWidth: 1, borderColor: COLORS.line, padding: 15, marginBottom: 22 },
  savingsTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  savingsTitle: { color: COLORS.ink, fontSize: 13, fontWeight: '900' },
  savingsSub: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  savingsEmoji: { fontSize: 23 },
  progressTrack: { height: 8, borderRadius: 10, backgroundColor: '#F0E4D8', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 10, backgroundColor: COLORS.mintDark },
  savingsBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 9, gap: 8 },
  savingsHint: { color: COLORS.muted, fontSize: 9, flex: 1 },
  savingsPercent: { color: COLORS.mintDark, fontSize: 12, fontWeight: '900' },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11, marginTop: 3 },
  sectionHeading: { color: COLORS.ink, fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
  sectionAction: { color: COLORS.peachDeep, fontSize: 11, fontWeight: '900' },
  transactionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.paper, borderRadius: 18, padding: 11, marginBottom: 8, borderWidth: 1, borderColor: COLORS.line },
  transactionIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  transactionMain: { flex: 1, minWidth: 0 },
  transactionTitle: { color: COLORS.ink, fontSize: 12, fontWeight: '800' },
  transactionSub: { color: COLORS.muted, fontSize: 9, marginTop: 5 },
  transactionAmountArea: { alignItems: 'flex-end', gap: 1 },
  transactionAmount: { color: COLORS.ink, fontSize: 12, fontWeight: '900' },
  moreButton: { paddingHorizontal: 2, paddingVertical: 1 },
  emptyState: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 },
  emptySticker: { width: 74, height: 74, borderRadius: 27, backgroundColor: COLORS.pinkLight, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { color: COLORS.ink, fontSize: 14, fontWeight: '900' },
  emptyText: { color: COLORS.muted, fontSize: 11, textAlign: 'center', lineHeight: 17, marginTop: 6, maxWidth: 250 },
  firstEntryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, borderWidth: 1, borderColor: '#F0C8A3', backgroundColor: '#FFF4E6', padding: 12, marginTop: 4 },
  firstEntryText: { color: COLORS.peachDeep, fontSize: 11, fontWeight: '900' },
  firstEntryHeart: { color: COLORS.red, fontSize: 16 },
  footerNote: { color: COLORS.muted, fontSize: 10, textAlign: 'center', marginTop: 18, marginBottom: 12 },
  bottomNav: { flexDirection: 'row', backgroundColor: COLORS.paper, borderTopWidth: 1, borderTopColor: COLORS.line, paddingTop: 7, paddingBottom: Platform.OS === 'ios' ? 4 : 7, paddingHorizontal: 8 },
  navItem: { flex: 1, alignItems: 'center', gap: 2 },
  navIconWrap: { width: 43, height: 29, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  navIconSelected: { backgroundColor: COLORS.mintLight },
  navLabel: { color: COLORS.muted, fontSize: 9, fontWeight: '700' },
  navLabelSelected: { color: COLORS.mintDark, fontWeight: '900' },
  pageTitle: { color: COLORS.ink, fontSize: 25, fontWeight: '900', letterSpacing: -0.8, marginTop: 7 },
  pageSubtitle: { color: COLORS.muted, fontSize: 11, marginTop: 5, marginBottom: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, height: 45, borderRadius: 15, backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.line, marginBottom: 11 },
  searchInput: { flex: 1, color: COLORS.ink, fontSize: 11, paddingVertical: 0 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 13 },
  filterPill: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.paper },
  filterPillActive: { backgroundColor: COLORS.peach, borderColor: '#F0A776' },
  filterText: { color: COLORS.muted, fontSize: 10, fontWeight: '800' },
  filterTextActive: { color: COLORS.ink },
  resultCount: { color: COLORS.muted, fontSize: 10, fontWeight: '700', marginBottom: 9 },
  floatingAdd: { position: 'absolute', right: 3, bottom: 13, backgroundColor: COLORS.orange, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: '#E5A02A', elevation: 3 },
  floatingAddText: { color: COLORS.ink, fontSize: 11, fontWeight: '900' },
  analyticsCard: { backgroundColor: COLORS.mint, borderRadius: 25, padding: 21, marginBottom: 16, overflow: 'hidden' },
  analyticsAmount: { color: COLORS.white, fontSize: 32, fontWeight: '900', marginTop: 8, marginBottom: 17 },
  analyticsDivider: { height: 1, backgroundColor: '#FFFFFF80', marginBottom: 15 },
  analyticsTotals: { flexDirection: 'row', gap: 40 },
  analyticsLabel: { color: '#285E52', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  analyticsIncome: { color: COLORS.white, fontSize: 15, fontWeight: '900', marginTop: 7 },
  analyticsWhite: { color: COLORS.white, fontSize: 15, fontWeight: '900', marginTop: 7 },
  analyticsFlower: { position: 'absolute', right: 18, top: 48, opacity: 0.22 },
  whiteCard: { backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.line, borderRadius: 20, padding: 15, marginBottom: 14 },
  categoryBarGroup: { marginTop: 13 },
  categoryBarTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7, gap: 8 },
  categoryBarName: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  categoryBarTitle: { color: COLORS.ink, fontSize: 11, fontWeight: '800' },
  categoryBarAmount: { color: COLORS.ink, fontSize: 11, fontWeight: '900' },
  categoryPercent: { color: COLORS.muted, fontSize: 9, marginTop: 5 },
  insightBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, backgroundColor: '#FFF1C9', borderWidth: 1, borderColor: '#F0DDA4', borderRadius: 18, padding: 14, marginBottom: 20 },
  insightTitle: { color: COLORS.ink, fontSize: 12, fontWeight: '900', marginBottom: 5 },
  insightText: { color: '#816A45', fontSize: 10, lineHeight: 16 },
  budgetHero: { backgroundColor: COLORS.peach, borderRadius: 25, padding: 20, marginTop: 3, marginBottom: 20 },
  budgetHeroAmount: { color: COLORS.ink, fontSize: 31, fontWeight: '900', marginTop: 9, marginBottom: 13 },
  budgetHeroMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 9 },
  budgetHeroSmall: { color: '#7A4B32', fontSize: 10, fontWeight: '800' },
  budgetRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: COLORS.paper, borderRadius: 17, borderWidth: 1, borderColor: COLORS.line, padding: 11, marginBottom: 9 },
  budgetDetails: { flex: 1, minWidth: 0, paddingTop: 2 },
  budgetSpent: { color: COLORS.muted, fontSize: 9, fontWeight: '800' },
  overBudget: { color: COLORS.red, fontSize: 9, fontWeight: '800', marginTop: 5 },
  budgetInputRow: { flexDirection: 'row', gap: 7, marginTop: 9 },
  budgetInput: { flex: 1, height: 35, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.white, borderRadius: 10, paddingHorizontal: 9, fontSize: 10, color: COLORS.ink },
  budgetSave: { backgroundColor: COLORS.mintLight, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 13 },
  budgetSaveText: { color: COLORS.mintDark, fontSize: 10, fontWeight: '900' },
  modalSafe: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 17, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: COLORS.line },
  modalClose: { width: 39, height: 39, borderRadius: 14, backgroundColor: COLORS.paper, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.line },
  modalTitle: { color: COLORS.ink, fontSize: 15, fontWeight: '900' },
  modalContent: { padding: 18, paddingBottom: 35 },
  typeSwitch: { flexDirection: 'row', gap: 9, marginBottom: 17 },
  typeChoice: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 13, borderRadius: 15, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.paper },
  typeChoiceExpense: { backgroundColor: COLORS.redLight, borderColor: '#EBC5B9' },
  typeChoiceIncome: { backgroundColor: COLORS.mintLight, borderColor: '#B8E3D4' },
  typeChoiceText: { color: COLORS.muted, fontSize: 11, fontWeight: '900' },
  fieldLabel: { color: COLORS.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginTop: 14, marginBottom: 8 },
  amountInputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.paper, paddingHorizontal: 15 },
  rupeeSymbol: { color: COLORS.ink, fontSize: 26, fontWeight: '900', marginRight: 7 },
  amountInput: { flex: 1, height: 60, fontSize: 29, fontWeight: '900', color: COLORS.ink },
  textInput: { backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.line, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 12, color: COLORS.ink, fontSize: 11 },
  noteInput: { minHeight: 72, textAlignVertical: 'top' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  categoryOption: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.paper, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 10 },
  categoryOptionText: { color: COLORS.muted, fontSize: 10, fontWeight: '700' },
  primaryButton: { backgroundColor: COLORS.peach, borderWidth: 1, borderColor: '#F0A776', borderRadius: 16, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 23 },
  primaryButtonText: { color: COLORS.ink, fontSize: 12, fontWeight: '900' },
  doodleStar: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  doodleStarText: { color: '#FFF7D8', fontSize: 28, fontWeight: '900' },
  flowerDoodle: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  flowerText: { color: '#FFF8E8', fontSize: 33 },
  bunnySticker: { width: 52, height: 54, alignItems: 'center', justifyContent: 'flex-end' },
  bunnyEarLeft: { position: 'absolute', width: 13, height: 27, borderRadius: 10, borderWidth: 2, borderColor: COLORS.ink, backgroundColor: COLORS.pink, left: 9, top: 0, transform: [{ rotate: '-10deg' }] },
  bunnyEarRight: { position: 'absolute', width: 13, height: 27, borderRadius: 10, borderWidth: 2, borderColor: COLORS.ink, backgroundColor: COLORS.pink, right: 9, top: 0, transform: [{ rotate: '10deg' }] },
  bunnyFace: { width: 43, height: 37, borderRadius: 20, borderWidth: 2, borderColor: COLORS.ink, backgroundColor: '#FFF8EC', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  bunnyEyes: { flexDirection: 'row', gap: 11, marginTop: 4 },
  bunnyCheeks: { position: 'absolute', left: 3, right: 3, top: 17, flexDirection: 'row', justifyContent: 'space-between' },
  bunnyNose: { color: COLORS.ink, fontSize: 13, fontWeight: '900', marginTop: -1 },
  bunnyBody: { position: 'absolute', bottom: -2, width: 27, height: 13, borderRadius: 12, backgroundColor: '#FFF8EC', borderWidth: 2, borderColor: COLORS.ink },
});
