// ==================== 第七十四波 · 市井花名册（城里的对手，从此有名有姓） ====================
// 摆摊的过客、当差的东家、赁屋的牙人、贩货的管事——四本新账的对手全是无名氏。
// 城中人物名册里住的是画圣诗仙那样的名人，市井的脸得另立一本：本账按「城+角色」播种定死一本花名册——
// 同一座城的掌柜永远是同一个掌柜（街坊认脸，脸不能天天换），换城换脸，零骰。
// 纪律：①花名册是纯口吻账——不改任何数目（工钱、摊价、租金、行价分毫不动）；
//       ②零新存档字段（名字按城播种现算，不落账）；③花名册缺席时四本账照旧说无名话（向后兼容）。
(function () {
    'use strict';

    var SURNAMES = ['王', '李', '张', '刘', '陈', '杨', '黄', '赵', '吴', '周', '徐', '孙',
        '马', '朱', '胡', '郭', '何', '罗', '高', '郑', '梁', '宋', '谢', '韩'];
    var GIVEN = ['守拙', '有德', '栓柱', '桂英', '文昌', '来顺', '秀娘', '三郎', '慧娘', '老蔫',
        '金钟', '玉柱', '小翠', '长贵', '淑贞', '二牛', '巧儿', '德海', '凤仙', '石头'];
    // 市井称呼：各角色各有叫法（掌柜的称掌柜，教蒙童的称先生）
    var ROLE_TITLES = {
        shopkeeper: '掌柜',        // 铺子伙计的东家
        tutor: '先生',             // 蒙馆代课的老先生
        doctor: '郎中',            // 医馆帮手坐堂的大夫
        watch_head: '更头',        // 更夫巡夜的班头
        broker: '牙人',            // 赁屋立契的中间人
        merchant_clerk: '管事',    // 商行贩货契柜上的管事
        neighbor: '婶子'           // 赁屋隔壁的街坊
    };
    var STREET_TITLES = ['婶子', '货郎', '石匠', '船家', '脚夫', '婆子', '樵夫', '车把式'];

    function hash(s) {
        var h = 0;
        for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) % 9973; }
        return h;
    }
    // 一张脸：城+角色定死（同城同角色永远同一张脸）
    function face(ct, role) {
        if (!ct || !role) return null;
        var h = hash(ct + '_faces_' + role);
        var surname = SURNAMES[h % SURNAMES.length];
        var given = GIVEN[(h >> 3) % GIVEN.length];
        var title = ROLE_TITLES[role] || '街坊';
        return {
            surname: surname,
            name: surname + given,          // 全名（王守拙）
            addr: surname + title,          // 市井称呼（王掌柜）
            title: title,
            full: title + '·' + surname + given   // 招牌写法（掌柜·王守拙）
        };
    }
    // 摊前过客：按城+日+第几位播种（同日同摊，来的都是这几张熟面孔）
    function passerby(ct, day, idx) {
        var h = hash(ct + '_street_' + (day || 0) + '_' + (idx || 0));
        var surname = SURNAMES[h % SURNAMES.length];
        var st = STREET_TITLES[(h >> 4) % STREET_TITLES.length];
        return { surname: surname, addr: surname + st, title: st };
    }

    window.CityFaces = {
        SURNAMES: SURNAMES,
        GIVEN: GIVEN,
        ROLE_TITLES: ROLE_TITLES,
        STREET_TITLES: STREET_TITLES,
        face: face,
        passerby: passerby
    };
})();
