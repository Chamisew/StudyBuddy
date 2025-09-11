// Only showing key parts changed for brevity

// imports
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";

// inside component
const [apps, setApps] = useState([]);
const [helpers, setHelpers] = useState([]);
const [viewMode, setViewMode] = useState("applications");
const [isAdmin, setIsAdmin] = useState(false);

useEffect(() => {
  const loadData = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const me = await getDoc(doc(db, "users", uid));
    const data = me.exists() ? me.data() : {};
    const admin = !!data.isAdmin || /\+admin/.test(auth.currentUser?.email || "");
    setIsAdmin(admin);
    if (!admin) return;

    // load applications
    const appsSnap = await getDocs(collection(db, "helpdeskApplicants"));
    const appsList = [];
    appsSnap.forEach((d) => appsList.push({ id: d.id, ...d.data() }));
    setApps(appsList);

    // load helpers
    const helpersSnap = await getDocs(collection(db, "helpdeskHelpers"));
    const helpersList = [];
    helpersSnap.forEach((d) => helpersList.push({ id: d.id, ...d.data() }));
    setHelpers(helpersList);
  };
  loadData();
}, []);
