export function formatCurrency(value: string) {
  let val = value.replace(/\D/g, "");
  if (!val) return "";
  return (Number(val) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatCPF(value: string) {
  let val = value.replace(/\D/g, "");
  if (val.length > 11) val = val.slice(0, 11);
  return val
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function formatCNPJ(value: string) {
  let val = value.replace(/\D/g, "");
  if (val.length > 14) val = val.slice(0, 14);
  return val
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function formatCPFCNPJ(value: string) {
  let val = value.replace(/\D/g, "");
  if (val.length > 14) val = val.slice(0, 14); // Limite máximo do CNPJ é 14 dígitos

  if (val.length <= 11) {
    // Formata CPF: 000.000.000-00
    return val
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  } else {
    // Formata CNPJ: 00.000.000/0000-00
    return val
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
}

export function formatPhone(value: string) {
  let val = value.replace(/\D/g, "");
  if (val.length > 11) val = val.slice(0, 11);
  if (val.length > 10) {
    return val.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  } else if (val.length > 5) {
    return val.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  } else if (val.length > 2) {
    return val.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
  } else if (val.length > 0) {
    return val.replace(/^(\d{0,2})/, "($1");
  }
  return val;
}

export function formatCEP(value: string) {
  const val = value.replace(/\D/g, "");
  return val.replace(/(\d{5})(\d{3})/, "$1-$2");
}
